<?php
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
