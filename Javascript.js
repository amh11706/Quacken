var map = [],
    boats = [],
	oldboats = [],
	moveactive = false,
	step = 0,
	turn = 90,
	faceX = [0, 1, 0, -1], faceY = [-1, 0, 1, 0];

function Boat(x, y, face, element) {
	this.x = x;
	this.y = y;
	this.face = face;
	this.damage = 0;
	this.treasure = 0;
	this.spawnturn = 90;
	this.undos = 0;
	this.moves = [];
	this.element = element;
	this.title = document.getElementsByClassName('boattitle')[boats.length];
	this.image = document.getElementsByClassName('boatimage')[boats.length];
}

function Dragable(dragElement, dragFrame) {
	this.startY = 0;
	this.startX = 0;
	this.offsetX = 0;
	this.offsety = 0;
	this.dragElement = dragElement;
	this.dragFrame = dragFrame;
}

function fetchMap() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			drawMap(JSON.parse(this.responseText));
		}
	};
	xmlhttp.open("GET", "getmap.php", true);
	xmlhttp.send();
}

fetchMap();
messageAdd('Welcome! This is just a single player demo with one map for now. Be sure to check <a href="https://www.quacken.net" target="_blank">Quacken.net</a> regularly for info and updates.');

var dragobject = new Dragable(document.getElementById('dragmap'), document.getElementById('mapbox'));
var timebox = new Dragable(document.getElementById('timer'), document.getElementById('timer'));
dragobject.dragFrame.onmousedown = function(event){OnMouseDown(event, dragobject)};
timebox.dragFrame.onmousedown = function(event){OnMouseDown(event, timebox)};

function drawMap(fetchedmap) {
	var dragmap = document.getElementById("dragmap");
	var maptile = document.getElementById("maptile");
	var column = 1, row = 1;
	for (row; row < 50; row++) {
		for (column = 1; column < 26; column++) {
			dragmap.appendChild(maptile.cloneNode(true));
			if (fetchedmap[row][column]) {
				dragmap.lastChild.appendChild(document.getElementById("obstacle" + fetchedmap[row][column]).cloneNode(true));
			}
		}
	}
	for (row = 0; row < 75; row++) {
		dragmap.appendChild(maptile.cloneNode(true));
		dragmap.lastChild.className = "sztile";
	}
	dragmap.appendChild(document.getElementById("boat"));
	dragmap.lastChild.id = "boat1";
	boats[0] = new Boat(13, 50, 0, dragmap.lastChild);
	oldboats[0] = new Boat ();
	map = fetchedmap;
}

function go() {
	var move;
	if (step == 0) {
		boats[0].image.style.transition = '.4s ease .1s';
		document.getElementById("go").disabled = true;
		document.getElementById("undo").disabled = true;
		for (var x in boats[0]) {
			oldboats[0][x] = boats[0][x];
		}
		turn--;
		moveactive = true;
		getMoves();
	}
	move = boats[0].moves[step];
	if (boats[0].face % 2) {
		boats[0].element.style.transition = 'bottom .5s ease-in .05s, left .5s ease-out';
	} else {
		boats[0].element.style.transition = 'bottom .5s ease-out, left .5s ease-in .05s';
	}
	if (move) {
		var rotate = boats[0].image.style.transform;
		var degrees = Number(rotate.substring(7, rotate.length - 4));
		if (boatTry(boats[0], boats[0].face)) {
			if (move == 1) {
				boats[0].face = (boats[0].face + 3) % 4;
				boats[0].image.style.transform = 'rotate(' + (degrees - 90) + 'deg)';
				boatTry(boats[0], boats[0].face);
			} else if (move == 3) {
				boats[0].face = (boats[0].face + 1) % 4;
				boats[0].image.style.transform = 'rotate(' + (degrees + 90) + 'deg)';
				boatTry(boats[0], boats[0].face);
			} else {
				boats[0].element.style.transition = '.5s linear';
			}
			boatDraw(boats[0], 0, 0);
		} else {
			if (move == 1) {
				boats[0].face = (boats[0].face + 3) % 4;
				boats[0].image.style.transform = 'rotate(' + (degrees - 90) + 'deg)';
			} else if (move == 3) {
				boats[0].face = (boats[0].face + 1) % 4;
				boats[0].image.style.transform = 'rotate(' + (degrees + 90) + 'deg)';
			}
		}
	}
	setTimeout(function(){boatCheck(boats[0])}, 750);
}

function boatCheck(boat) {
	if (boat.damage < 3) {
		var tile = 0;
		if (boat.x < 0) {
			boat.x++;
		} else if (boat.x > 26) {
			boat.x--;
		} else if (boat.y < 0) {
			boat.y++;
		} else if (boat.y > 53) {
			boat.y--;
		}
		tile = map[boat.y][boat.x];
		if (tile > 4) {
			if (tile < 9) {	//tile is wind
				boatTry(boat, tile - 5);
				boat.element.style.transition = '.4s linear';
			} else {		//tile is a whirl
				var rotate = boat.image.style.transform;
				var degrees = Number(rotate.substring(7, rotate.length - 4));
				if (tile % 2) {
					boat.element.style.transition = 'bottom .5s ease-out, left .5s ease-in .05s';
				} else {
					boat.element.style.transition = 'bottom .5s ease-in .05s, left .5s ease-out';
				}
				if (boatTry(boat, tile - 9)) {
					boatTry(boat, tile % 4);
				}
				boat.face = (boat.face + 1) % 4;
				boat.image.style.transform = 'rotate(' + (degrees + 90) + 'deg)';
			}
			boatDraw(boat, 0, 0);
		}
	}
	if (step < 3) {
		setTimeout(go, 700);
		step ++;
	} else {
		step = 0;
		timeUpdate();
		clearMoves();
	}
}

function boatTry(boat, direction) {
	var tryX = boat.x + faceX[direction];
	var tryY = boat.y + faceY[direction];
	if (tryX >= 0 && tryX < 27 && tryY >= 0 && tryY < 54) {
		var tile = map[tryY][tryX];
		if (tile && tile < 5) { //pick up treasure
			if (tile > boat.treasure) {
				boat.treasure = tile;
				treasureUpdate();
			}
		}
		if (tile < 13) {
			boat.x = tryX;
			boat.y = tryY;
			if (boat.y > 49 && boat.x > 0 && boat.x < 26) {
				if (boat.treasure) {
					var treasure = ['', 'a cuttle cake', 'a taco locker', 'a pea pod', 'a fried egg'];
					var turns = boat.spawnturn - turn;
					var timer = Math.floor(turns / 3) + ':'+ (turns % 3 * 20);
					if (!(turns % 3)) {
						timer += '0';
					}
					messageAdd('You loaded ' + treasure[boat.treasure] + ' in ' + timer);
					document.getElementById('treasure' + boat.treasure).innerHTML++;
				}					
				setTimeout(function(){boatSpawn(boat)}, 500);
			}
			return true;
		}
		setTimeout(function(){boatCrunch(boat, direction)}, 250);
		return false;
	}
	boat.x = tryX;
	boat.y = tryY;
	return true;
}

function boatCrunch(boat, direction) {
	boat.damage ++;
	document.getElementById('damagemeter').value = boat.damage / 3;
	document.getElementById('damagemeter').innerHTML = boat.damage / 3;
	boat.element.style.transition = '.1s';
	boatDraw(boat, faceX[direction] * 0.1, faceY[direction] * 0.1);
	if (boat.damage >= 3) {
		setTimeout(function(){boatSink(boat)}, 75);
	}
	setTimeout(function(){boatDraw(boat, 0, 0)}, 110);
}

function boatSink(boat) {
	var rotate = boat.image.style.transform;
	var degrees = Number(rotate.substring(7, rotate.length - 4));
	boat.moves = [];
	boat.image.style.transition = '3s linear 1s';
	boat.image.style.transform = 'rotate(' + (degrees + 720) + 'deg)';
	boat.image.style.opacity = 0;
	setTimeout(function(){boatSpawn(boat)}, 4000);
}

function boatSpawn(boat) {
	if (boat.treasure) {
		document.getElementById('treasurebox').removeChild(document.getElementById('treasurebox').firstChild);
	}
	boat.x = 13;
	boat.y = 50;
	boat.face = 0;
	boat.damage = 0;
	boat.treasure = 0;
	boat.moves = [];
	boat.spawnturn = turn;
	boat.image.style.transition = '0s';
	boat.element.style.transition = '0s';
	boat.image.style.opacity = '1';
	boat.image.style.transform = 'rotate(0deg)';
	document.getElementById('damagemeter').value = 0;
	document.getElementById('damagemeter').innerHTML = 0;
	boatDraw(boat, 0, 0);
}

function boatDraw(boat, offX, offY) {
	boat.element.style.bottom = (52 - boat.y - offY) * 50 + 'px';
	boat.element.style.left = (boat.x - 1 + offX) * 50 + 'px';
}

function treasureUpdate() {
	var box = document.getElementById('treasurebox');
	if (box.firstChild) {
		box.removeChild(box.firstChild);
	}
	if (boats[0].treasure) {
		box.appendChild(document.getElementById('obstacle' + boats[0].treasure).cloneNode(true));
	}
}

function timeUpdate() {
	var timer = Math.floor(turn / 3) + ':'+ (turn % 3 * 20);
	if (!(turn % 3)) {
		timer = timer + '0';
	}
	document.getElementById('turncount').innerHTML = timer;
}

function messageAdd (message) {
	var box = document.getElementById('textbox')
	var para = document.createElement("p");
	para.innerHTML = (message);
	box.appendChild(para);
	box.scrollTop += 20;
}

function undoTurn() {
	if (boats[0].damage >= 3) {
		setTimeout(undoTurn, 1000);
	} else {
		document.getElementById("undo").disabled = true;
		for (var x in boats[0]) {
			 boats[0][x] = oldboats[0][x];
		}
		boats[0].undos++;
		turn++;
		boatDraw(boats[0], 0, 0);
		boats[0].image.style.transform = 'rotate(' + boats[0].face * 90 + 'deg)';
		document.getElementById('damagemeter').value = boats[0].damage / 3;
		timeUpdate();
		treasureUpdate();
		messageAdd('You undid a turn');
	}
}


function getMoves() {
	var tiles = document.getElementsByClassName("moves");
	boats[0].moves = [0,0,0,0];
	for (var i = 0; i < 4; i++) {
		if (tiles[i].firstChild) {
			boats[0].moves[i] = tileToNumber(tiles[i].firstChild.name);
		}
	}
}

function clearMoves() {
	var tiles = document.getElementsByClassName("moves");
	for (var i = 0; i < 4; i++) {
		if(tiles[i].firstChild) {
			tiles[i].removeChild(tiles[i].firstChild);
		}
	}
	if (turn) {
		moveactive = false;
		document.getElementById("go").disabled = false;
		document.getElementById("undo").disabled = false;
	} else {
		messageAdd('Round ended; refresh the page to start again.');
	}
}

function clickTile(ev) {
	if(moveactive == true) {
		return;
	} else {
		var box = ev.target;
		var move = 0;
		if(box.getAttribute("class") == "tiles") {
			box = box.parentNode;
		}
		if(box.firstChild) {
			move = box.firstChild.name;
			box.removeChild(box.firstChild);
		}
		move = numberToTile((tileToNumber(move) + ev.which)%4);
		if(move) {
			box.appendChild(document.getElementById(move).cloneNode(true));
			box.firstChild.id = box.name;
		}
	}
}

function tileToNumber(move) {
	var moves = [0,'left','forward','right'];
	var i = 0;
	while(move != moves[i]) {
		i++;
	}
	return i;
}

function numberToTile(number) {
	var moves = [0,'left','forward','right'];
	return moves[number];
}

function drag(ev) {
	if(moveactive == true) {
		return;
	}
	ev.dataTransfer.setData("tile", ev.target.name);
	ev.dataTransfer.setData("source", ev.target.parentNode.id);
}

function drop(ev) {
	var data = ev.dataTransfer.getData("tile");
	var source = ev.dataTransfer.getData("source");
	var box = ev.target;
	if(box.getAttribute("class") == "tiles"){
		box = box.parentNode;
	}
	if(box.firstChild) {
		if(source != "movesource") {
			document.getElementById(source).appendChild(box.firstChild);
		} else {
			box.removeChild(box.firstChild);
		}
	}
	box.appendChild(document.getElementById(data).cloneNode(true));
	box.firstChild.id = box.name;
}

function dragEnd(ev) {
	if(ev.target.parentNode.className == "moves") {
		ev.target.parentNode.removeChild(ev.target.parentNode.firstChild);
	}
}

function OnMouseDown(event, object) {
	event.preventDefault();
	document.onmousemove = function(event){OnMouseMove(event, object)};
	document.onmouseleave = OnMouseUp;
	document.onmouseup = OnMouseUp;
	object.startX = event.clientX;
	object.startY = event.clientY;
	object.offsetX = object.dragElement.offsetLeft;
	object.offsetY = object.dragElement.offsetTop;
}

function OnMouseMove(event, object) {
	object.dragElement.style.left = (object.offsetX + event.clientX - object.startX) + 'px';
	object.dragElement.style.top = (object.offsetY + event.clientY - object.startY) + 'px';
}

function OnMouseUp(event) {
	document.onmousemove = null;
	document.onmouseleave = null;
	document.onmouseup = null;
}