<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Cache-Control: no-cache");
header("Pragma: no-cache");
?>
<!DOCTYPE html>
<html>
<head>
<title>Disturb the Quacken</title>
<base target="_top">
<link rel="stylesheet" type="text/css" href="Stylesheet.css">
</head>

<body>
<div class="noselect" id="mapbox" oncontextmenu="event.preventDefault();">
	<div class="dragmap ui-widget-content" id="dragmap"></div>
</div>

<div class="container noselect" id="container">
	<div id="lefthud">
		<div id="damage">
			<meter id="damagemeter" value="0">0</meter>
		</div>
		<div id="movesource" name="movesource">
			<img class="tiles" name="left" id="left" src="images/arrow1.png" draggable="true" ondragstart="drag(event)" ondragend="dragEnd(event)">
			<img class="tiles" name="forward" id="forward" src="images/arrow2.png" draggable="true" ondragstart="drag(event)" ondragend="dragEnd(event)">
			<img class="tiles" name="right" id="right" src="images/arrow3.png" draggable="true" ondragstart="drag(event)" ondragend="dragEnd(event)">
		</div>
		<div id="treasurebox"></div>
		<div id="buttons">
			<button class="button" id="undo" onclick="undoTurn()" disabled>Undo Turn</button>
			<button class="button" id="go" onclick="go()">Go</button>
		</div>
		<div id="moves" oncontextmenu="event.preventDefault();">
			<div class="moves" name="move1" id="slot1" onmouseup="clickTile(event)" ondrop="drop(event)" ondragover="event.preventDefault()"></div>
			<div class="moves" name="move2" id="slot2" onmouseup="clickTile(event)" ondrop="drop(event)" ondragover="event.preventDefault()"></div>
			<div class="moves" name="move3" id="slot3" onmouseup="clickTile(event)" ondrop="drop(event)" ondragover="event.preventDefault()"></div>
			<div class="moves" name="move4" id="slot4" onmouseup="clickTile(event)" ondrop="drop(event)" ondragover="event.preventDefault()"></div>
		</div>
	</div>	
		<div id="output">
			<div id="textbox">
		</div>
	</div>
</div>

<div class="noselect" id="timer">
	<p id="turncount">30:00</p>
	<img class="unrotate" id="obstacle1" title="cuttle cake" src="images/obstacle1.png" height="50" width="50">
	<p id="treasure1">0</p>
	<img class="unrotate" id="obstacle2" title="taco locker" src="images/obstacle2.png" height="50" width="50">
	<p id="treasure2">0</p>
	<img class="unrotate" id="obstacle3" title="pea pod" src="images/obstacle3.png" height="50" width="50">
	<p id="treasure3">0</p>
	<img id="obstacle4" title="fried egg" src="images/obstacle4.png" height="50" width="50">
	<p id="treasure4">0</p>
</div>

<script src="Javascript.js" type="text/javascript"></script>
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
		<p class="boattitle" id="boattitle">Boat</p>
		<img class="boatimage" id="boatimage" src="images/boat.png">
	</div>
</div>
</body>
</html>