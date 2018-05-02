<?php
/*
This script is triggered when a user enters a command that is not handled on the
client side. Its response text is added to the user's chat box as a note.
*/

if (isset($_COOKIE['token']) && isset($_GET['m'])) $message = $_GET['m'];
else exit;

switch ($message) {
	case 'list':
		require 'classes/Quackenpdo.php';
		$conn = new QuackenPDO();

		$players = $conn->query("SELECT UserName FROM lobby1", PDO::FETCH_COLUMN, 0)->fetchAll();
		echo 'Player list: ' . join(', ', $players);
		break;
	default:
		$commands = ['help', 'clear', 'list', 'exit'];
		echo 'Command list: ' .  join(', ', $commands);
}
?>
