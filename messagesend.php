<?php
/*
This script is triggered when a user sends a chat messsage to the lobby chat.
It returns a json encoded array containing the message(s) to add to the user's
chat box.
*/

require 'classes/Quackenpdo.php';

if (isset($_COOKIE['token']) && isset($_GET['id']) && isset($_GET['m'])) {
	$conn = new QuackenPDO();
	$conn->setUser($_GET['id'])
		->setLobby('lobby1');
} else exit;

$user = $conn->getLobbyUser('UserName, ChatIndex');
if (!$user) exit;

$conn->insertChat($user['UserName'], $_GET['m']);

$messages = $conn->getNewChat($user['ChatIndex']);
echo '["messages",', json_encode($messages), ']';
$user['ChatIndex'] += count($messages);

$conn->updateLobbyUser(array('ChatIndex' => $user['ChatIndex']));
?>
