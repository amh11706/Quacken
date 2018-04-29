<?php
ignore_user_abort(true);
require 'classes/Quackenpdo.php';

if (isset($_COOKIE['token']) && isset($_GET['id'])) {
	$conn = new QuackenPDO();
	$conn->setUser($_GET['id'])
		->setLobby('lobby1');
} else exit;

$user = $conn->getLobbyUser('UserName');
if ($user) $conn->removeUser($user['UserName']);
?>
