<?php
/*
This script is triggered when a user pings the server on a 1 second interval.
It returns a json encoded array containing the message(s) to add to the user's
chat box, other boat's moves if there are any, and the turn to animate if there
is a new one to send.
*/

ignore_user_abort(true);
require 'classes/Quackenpdo.php';

if (isset($_COOKIE['token']) && isset($_GET['id']) &&
		isset($_GET['m']) && isset($_GET['r'])) {
	$uid = $_GET['id'];
	$response = array();
	$conn = new QuackenPDO();
	$conn->setUser($uid)
		->setLobby('lobby1');
} else kick();

$user = $conn->getLobbyUser('ChatIndex, CurrentTurn, Idle');
if (!$user) kick();

if (strlen( $_GET['r'] ) === 1 && preg_match( '/^[0-3]{4}$/', $_GET['m'] )) {
	$user['Ready'] = $_GET['r'];
	$user['Moves'] = $_GET['m'];
} else kick();

$conn->removeGhosts();

$moves = $conn->query("SELECT ID, Moves FROM lobby1 WHERE ID <> $uid")
	->fetchAll();
if ($moves) $response[] = array('moves', $moves);

$messages = $conn->getNewChat($user['ChatIndex']);
if ($messages) {
	$response[] = array('messages', $messages);
	$user['ChatIndex'] += count($messages);
}

if ($user['Moves'] !== '0000') $user['Idle'] = 0;
$conn->updateLobbyUser($user);

$turnString = getTurn($conn, $user['CurrentTurn']);
if (!$turnString && $user['Ready']) {
	$turnString = checkAndDoTurn($conn, $user['CurrentTurn']);
}
if ($turnString) $response[] = $turnString;

echo json_encode($response);

function kick() {
	echo '"kick"';
	exit;
}

function getTurn(QuackenPDO $conn, int $turn) {
	if ($result = $conn->query(
	 "SELECT TurnString, TreasureString, Turn
		FROM lobbies WHERE Turn <> $turn"
	)->fetch()) {
		$conn->updateLobbyUser(array( 'CurrentTurn' => $result[2], 'Ready' => 0 ));
		return array_merge(array( 'turn' ), $result);
	}
}

function checkAndDoTurn(QuackenPDO $conn, int $turn) {
	if (
		$conn->query(
		 "SELECT Ready FROM lobby1
		 	WHERE Ready = 0 AND Idle = 0 OR CurrentTurn <> $turn"
		)->fetch() || !$conn->exec(
		 "UPDATE lobbies SET TurnActive = 1
		 	WHERE UNIX_TIMESTAMP(Timestamp) < (UNIX_TIMESTAMP() - 5)"
		)
	) return;

	require 'classes/Turn.php';
	require 'classes/Boat.php';

	$turnObj = $conn->query("SELECT Map, TreasureString, Turn FROM lobbies")
		->fetchAll(PDO::FETCH_CLASS, 'Turn')[0];

	$turnObj->insertBoats($conn->query(
	 "SELECT ID, UserName, Moves, X, Y, Face, Damage, Treasure, SpawnTurn FROM lobby1"
	)->fetchAll(PDO::FETCH_CLASS, 'Boat'));

	$response = array('turn', $turnObj->doTurn(), $turnObj->updateTreasure($conn));
	$turnObj->updateDB($conn);

	$turn = $turnObj->getTurn();
	$response[] = $turn;

	$conn->updateLobbyUser(array( 'CurrentTurn' => $turn, 'Ready' => 0 ));

	return $response;
}
?>
