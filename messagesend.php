<?php
require 'classes/Quackenpdo.php';

if (isset($_COOKIE['token']) && isset($_GET['id']) && isset($_GET['m'])) {
	$conn = new QuackenPDO();
	$conn->setUser($_GET['id'])
			 ->setLobby('lobby1');
	} else kick();

$user = $conn->getLobbyUser('UserName, ChatIndex');
if (!$user) kick();

$conn->insertChat($user['UserName'], $_GET['m']);

$messages = $conn->getNewChat($user['ChatIndex']);
echo '[["messages",', json_encode($messages), ']]';
$user['ChatIndex'] += count($messages);

$conn->updateLobbyUser(array('ChatIndex' => $user['ChatIndex']));

function kick() {
	echo 'kick';
	exit;
}
?>
