<?php
require 'classes/Quackenpdo.php';

if (isset($_COOKIE['token'])) $conn = new QuackenPDO();
else kick();

$conn->setLobby('lobby1')
		 ->removeGhosts();

$user = $conn->getUser();
if (!$user) kick();

$pcount = $conn->query("SELECT COUNT(ID) FROM lobby1")->fetch()[0];
if ($pcount > 1) $message = 'are ' . $pcount . ' other players';
else if ($pcount) $message = 'is 1 other player';
else $message = 'are no other players';

$cIndex = $conn->query("SELECT MAX(ID) FROM chat")->fetch(PDO::FETCH_NUM)[0];

$boats = $conn->query("SELECT UserName, Moves, X, Y, Face, ID FROM lobby1")
		->fetchAll();
$x = spawnBoat($boats);

$lobbyVars = $conn->query("SELECT Map, Turn, UNIX_TIMESTAMP(Timestamp) as Time,
		TreasureString FROM lobbies")->fetch(PDO::FETCH_ASSOC);
$timeOffset = time() - $lobbyVars['Time'];

if ($timeOffset > 30) {
	$timeOffset = 0;
	$lobbyVars['Turn'] = 0;
	$lobbyVars['TreasureString'] = '[0,0,0,0]';
	$conn->exec("UPDATE lobbies SET Turn = 0, TreasureString = '[0,0,0,0]'");
} else if ($timeOffset > 19) $timeOffset = 0;

$ip = $_SERVER['REMOTE_ADDR'];
$turn = $lobbyVars['Turn'];
$un = $user['UserName'];
$token = $user['Token'];
$conn->exec(
 "INSERT INTO lobby1 (UserName, Token, IP, ChatIndex, X, Y, CurrentTurn)
	VALUES ('$un', '$token', '$ip', $cIndex, $x, 49, $turn)"
);
$id = $conn->lastInsertId();
$boats[] = array($user['UserName'], 0, $x, 49, 0, $id);

$conn->exec(
 "INSERT INTO chat (Name, Message, Type, IP)
	VALUES ('$un', '> $id $x 49', 'note', '$ip')"
);

function kick() {
	setcookie('token', null, 1, '/');
	header('Location: /accounts.php?target=' . $_SERVER['REQUEST_URI']);
	exit;
}

function spawnBoat(array &$boats) {
	$x = 12;
	$y = 49;
	$xshift = 2;
	$try = 1;
	do {
		$blocked = false;
		foreach ($boats as $boat) {
			if ($boat[2] == $x && ($boat[3] == $y || $boat[3] == $y - 1)) {
				$blocked = true;
				break;
			}
		}
		if ($blocked) {
			$x += $xshift * $try;
			$xshift += 2;
			$try = -$try;
		}
	} while ($blocked);

	return $x;
}
?>

<!DOCTYPE html>
<html>
<head>
<title>Disturb the Quacken</title>
<base target="_top">
<link rel="stylesheet" type="text/css" href="quacken0_2.css">
</head>

<body>
<div class="noselect" id="mapbox" oncontextmenu="event.preventDefault();">
	<div class="dragmap ui-widget-content" id="dragmap"></div>
</div>

<div class="container noselect" id="container">
	<div id="lefthud">
		<div id="time">
			<div id="timebar"></div>
		</div>
		<div id="moves" oncontextmenu="event.preventDefault();">
			<div class="moves" name="move1" id="slot0" onmouseup="clickTile(event)" ondrop="drop(event)" ondragover="event.preventDefault()"></div>
			<div class="moves" name="move2" id="slot1" onmouseup="clickTile(event)" ondrop="drop(event)" ondragover="event.preventDefault()"></div>
			<div class="moves" name="move3" id="slot2" onmouseup="clickTile(event)" ondrop="drop(event)" ondragover="event.preventDefault()"></div>
			<div class="moves" name="move4" id="slot3" onmouseup="clickTile(event)" ondrop="drop(event)" ondragover="event.preventDefault()"></div>
		</div>
		<div id="damage">
			<meter id="damagemeter" value="0" max="3">0</meter>
		</div>
		<div id="movesource" name="movesource">
			<img class="tiles" name="tile1" id="tile1" src="images/arrow1.png" draggable="true" ondragstart="drag(event)" ondragend="dragEnd(event)">
			<img class="tiles" name="tile2" id="tile2" src="images/arrow2.png" draggable="true" ondragstart="drag(event)" ondragend="dragEnd(event)">
			<img class="tiles" name="tile3" id="tile3" src="images/arrow3.png" draggable="true" ondragstart="drag(event)" ondragend="dragEnd(event)">
		</div>
		<div id="treasurebox"></div>
		<div id="buttons">
			<button class="button" id="go" onclick="readyButton()">Ready</button>
		</div>
	</div>
	<div id="output">
		<div id="textbox"></div>
	</div>
	<form id="input" onsubmit="sendInput(event)">
		<input id="textinput" type="text" autocomplete="off" maxlength="200" autofocus>
	</form>
</div>

<div class="noselect" id="timer">
	<p id="turncount"></p>
	<img class="unrotate" id="obstacle1" title="cuttle cake" src="images/obstacle1.png" height="50" width="50">
	<p id="treasure0">0</p>
	<img class="unrotate" id="obstacle2" title="taco locker" src="images/obstacle2.png" height="50" width="50">
	<p id="treasure1">0</p>
	<img class="unrotate" id="obstacle3" title="pea pod" src="images/obstacle3.png" height="50" width="50">
	<p id="treasure2">0</p>
	<img id="obstacle4" title="fried egg" src="images/obstacle4.png" height="50" width="50">
	<p id="treasure3">0</p>
</div>

<div class="hidden">
	<img id="obstacle5" src="images/obstacle5.png" height="50" width="50">
	<img id="obstacle6" src="images/obstacle6.png" height="50" width="50">
	<img id="obstacle7" src="images/obstacle7.png" height="50" width="50">
	<img id="obstacle8" src="images/obstacle8.png" height="50" width="50">
	<img id="obstacle9" src="images/obstacle9.png" height="50" width="50">
	<img id="obstacle10" src="images/obstacle10.png" height="50" width="50">
	<img id="obstacle11" src="images/obstacle11.png" height="50" width="50">
	<img id="obstacle12" src="images/obstacle12.png" height="50" width="50">
	<img class="unrotate" id="obstacle13" src="images/obstacle13.png" height="50" width="50">
	<div class="maptile" id="maptile"></div>

	<div class="boats" id="boat">
		<div class="boatheader">
			<span class="boattitle" id="boattitle"></span>
			<div id="movebar">
			<div class="movebar" id="bar0"></div>
			<div class="movebar" id="bar1"></div>
			<div class="movebar" id="bar2"></div>
			<div class="movebar" id="bar3"></div>
			</div>
		</div>
		<img class="boatimage" id="boatimage" src="images/boat.png">
	</div>
</div>
<script src="classes/Boat.js"></script>
<script src="classes/Dragable.js"></script>
<script>
const myBoat = <?php echo $id;?>;
const serverBoats = <?php echo json_encode($boats);?>;
let timer = <?php echo (90 - $turn) * 20 - $timeOffset;?>;
let map = <?php echo $lobbyVars['Map'];?>;
let boats = {};

!function setStartingBoats() {
	let boatHeader;

	for (let boat of serverBoats) {
		boats[boat[5]] = new Boat(boat[5], boat[0], boat[2], boat[3], boat[4]);
	}

	boats[myBoat].moves = [0, 0, 0, 0];
	boats[myBoat].isMe = true;
	boatHeader = boats[myBoat].element.firstElementChild;
	boatHeader.style.left = '0px';
	boatHeader.style.color = 'aquamarine';
	boatHeader.removeChild(boatHeader.lastElementChild);
}();
</script>
<script src="quacken0_2.js"></script>
<script>
updateTreasure(<?php echo $lobbyVars['TreasureString'];?>);
addMessage('Welcome <?php echo $user['UserName'];?>! This is just a demo with one map for now. Be sure to check <a href=' +
		'"https://www.quacken.net" target="_blank">Quacken.net</a> regularly for info and updates.', 'note');
addMessage('There <?php echo $message;?> in the lobby. Use /list to show all players.', 'note');
</script>
</body>
</html>
