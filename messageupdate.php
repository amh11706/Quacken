<?php
ignore_user_abort(true);
require 'quackenpdo.php';

if (isset($_COOKIE['token']) && isset($_GET['id']) && isset($_GET['m']) && isset($_GET['r'])) {
	$uid = $_GET['id'];
	$conn = new QuackenPDO($uid, $_COOKIE['token'], $_SERVER['REMOTE_ADDR']);
} else kick();

$conn->setLobby('lobby1');
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
if ($messages) $response[] = array('messages', $messages);
$user['ChatIndex'] += count($messages);

if ($user['Moves'] !== '0000') $user['Idle'] = 0;
$conn->updateLobbyUser($user);

$turn = $user['CurrentTurn'];
$leftBehind = $conn->query("SELECT CurrentTurn FROM lobby1
		WHERE CurrentTurn <> $turn")->fetch();

if ($user['Ready'] && !$leftBehind) $turnString = checkAndDoTurn($conn);
else $turnString = getTurn($conn, $turn);
if ($turnString) $response[] = $turnString;

if (isset( $response )) echo json_encode($response);

function kick() {
	echo 'kick';
	exit;
}

function getTurn(QuackenPDO $conn, int $turn) {
	if ($result = $conn->query("SELECT TurnString, TreasureString, Turn
			FROM lobbies WHERE Turn <> $turn")->fetch()) {
		$conn->updateLobbyUser(array( 'CurrentTurn' => $result[2], 'Ready' => 0 ));
		return array_merge(array( 'turn' ), $result);
	}
}

function checkAndDoTurn(QuackenPDO $conn) {
	if ($conn->query("SELECT Ready FROM lobby1 WHERE Ready = 0 AND Idle = 0")->fetch() ||
			!$conn->exec("UPDATE lobbies SET TurnActive = 1 WHERE TurnActive = 0")) return;

	require 'classes/Turn.php';
	require 'classes/Boat.php';

	$turnObj = $conn->query("SELECT Map, TreasureString, Turn FROM lobbies")
			->fetchAll(PDO::FETCH_CLASS, 'Turn')[0];

	$turnObj->insertBoats($conn->query("SELECT
			ID, UserName, Moves, X, Y, Face, Damage, Treasure, SpawnTurn FROM lobby1")
			->fetchAll(PDO::FETCH_CLASS, 'Boat'));

	$response = array('turn', $turnObj->doTurn(), $turnObj->updateTreasure($conn));
	$turnObj->updateDB($conn);

	$turn = $turnObj->getTurn();
	$response[] = $turn;

	$conn->updateLobbyUser(array( 'CurrentTurn' => $turn, 'Ready' => 0 ));

	return $response;
}
?>
