let freezeMyMoves = false;
let timerLock = false;
let waitingForTurn = false;
let timeOut = 0;
let step = 7;
let turn;
let animateTimeout;
let blurred = false;

const mapBox = new Dragable(document.getElementById('dragmap'),
      document.getElementById('mapbox'));
const timeBox = new Dragable(document.getElementById('timer'),
      document.getElementById('timer'));

document.addEventListener('visibilitychange', function(){
  blurred = document.hidden;

  if (blurred) {
	  clearTimeout(animateTimeout);
	  if (step < 4) clearMyMoves();
	  step = 7;
  } else if (turn) {
	  endTurn();
	  syncTimer();
  }
});

document.onkeydown = function(event){
	if (event.shiftKey) return;

	if (event.which == 9 || event.which == 191) { //key is tab or '/'
		if (event.which == 191) document.getElementById('textinput').value += '/';
		event.preventDefault();
		document.getElementById('textinput').focus();
	}
}

window.onbeforeunload = () => serverRequest("leave.php?id=" + myBoat);

syncTimer();
setInterval(tickTimer, 1000);
drawMap(map);

function syncTimer() {
	document.getElementById('timebar').style.transition = '0s';
  updateTimer();

	setTimeout(function() {document.getElementById('timebar').style.transition = '.9s linear';}, 100);
}

function tickTimer() {
  if (timer < 1800 && !(timer % 20) && !timerLock) ready();
  if (timer < 0) timer = 0;

  updateTimer();
	getUpdates();
}

function updateTimer() {
  let seconds = timer % 60;
  if (seconds < 10) seconds = '0' + seconds;

  document.getElementById('turncount').innerHTML = Math.floor(timer / 60) + ':' + seconds;
  timer--;
	document.getElementById('timebar').style.height = timer % 20 * 4 + 'px';
}

function startNewRound() {
	addMessage('New round starting.');
  document.getElementById('go').disabled = false;
	timerLock = false;
	freezeMyMoves = false;
	timer = 1800;
}

function drawMap(map) {
	const dragMap = document.getElementById("dragmap");
	const mapTile = document.getElementById("maptile");

	for (let row = 0; row < 49; row++) {
		for (let column = 0; column < 25; column++) {
			dragMap.appendChild(mapTile.cloneNode(true));
			if (map[row][column]) {
				dragMap.lastChild.appendChild(document.getElementById("obstacle" + map[row][column]).cloneNode(true));
			}
		}
	}

	for (let tile = 0; tile < 75; tile++) {
		dragMap.appendChild(mapTile.cloneNode(true));
		dragMap.lastChild.className = "sztile";
	}
}

function sendInput (e) {
	const textBox = document.getElementById('textinput');
	const message = textBox.value;
	e.preventDefault();

	if (message) {
		textBox.value = '';
		message[0] == '/' ? sendCommand(message) : sendMessage(message);
	}
}

function sendMessage(message) {
	serverRequest("messagesend.php?id=" + myBoat + "&m=" + encodeURIComponent(message), parseResponse);
}

function sendCommand(message) {
	message = message.substring(1);

	if (message === 'exit') {
		serverRequest("leave.php?id=" + myBoat);
		setTimeout(function(){window.close();}, 100);
	} else if (message === 'clear') {
		document.getElementById('textbox').innerHTML = '';
	} else {
		serverRequest("commandsend.php?m=" + encodeURIComponent(message), addMessage);
	}
}

function getUpdates() {
	serverRequest("messageupdate.php?id=" + myBoat + "&m=" + boats[myBoat].moves.join('') + '&r=' +
				  (waitingForTurn ? 1 : 0), parseResponse);
}

function parseResponse(response) {
	if (response == 'kick') {
    addMessage('kick', 'error');
    window.location.replace("/accounts.php?target=/multi/quacken.php&m=Invalid%20Session");
  }
	response = JSON.parse(response);

	for (let part of response) {
		switch (part[0]) {
			case 'moves':
				updateMoves(part[1]);
				break;
			case 'messages':
				addMessages(part[1]);
				break;
			case 'turn':
				startTurn(part);
				break;
			default:
		}
	}
}

function addMessages(messages) {
	for (let message of messages) {
		switch (message[2]) {
			case 'chat':
				message[1] = message[1].replace('<', '&lt;');
				addMessage(`${message[0]} says "${message[1]}"`, 'chat');
				break;
			case 'note':
				addRemovePlayer(message[0], message[1]);
				break;
			case 'load':
				addMessage(message[1]);
				break;
			case 'tres':
				tresSum(message[1]);
				break;
			default:
		}
	}
}

function addMessage (message, type = 'note') {
	const box = document.getElementById('textbox');
	const autoScroll = box.scrollHeight < 100 || box.scrollTop + 110 >= box.scrollHeight;
	let p;
	if (!message) return;

	p = document.createElement('p');
	p.className = type;
	p.innerHTML = message;
	box.appendChild(p);
	if (autoScroll) box.scrollTop = box.scrollHeight - 100;
}

function tresSum(treasure) {
	const types = [' Cuttle Cake', ' Taco Locker', ' Pea Pod', ' Fried Egg'];
	let message;
	let messageParts = [];
	treasure = JSON.parse(treasure);

	for (let x = 0; x < 4; x++) {
		if (treasure[x]) messageParts.push(treasure[x] + types[x] + ( treasure[x] > 1 ? 's' : '' ));
	}

	if (messageParts.length) {
    addMessage('Round ended. Treasure count: ' + messageParts.join(', ') + '.');
  } else {
    addMessage('Round ended. No treasure was loaded.');
  }
}

function updateMoves(allMoves) {
	const moveColor = ['grey', '#b9cef1', '#97c469', '#ff9d55'];

	for (let moves of allMoves) {
		const moveString = moves[1];
		const boat = boats[moves[0]];
		if (!boat) return;

		for (let x = 0; x < 4; x++) {
			boat.moveBar[x].style.backgroundColor = moveColor[moveString[x]];
		}
	}
}

function addRemovePlayer(name, vars) {
	const [action, uid, x, y] = vars.split(' ');
	if (uid == myBoat) return;

	if (action == '>') {
		addMessage(`${name} has joined the lobby.`, 'note');
		boats[uid] = new Boat(uid, name, x, y);
	} else if (boats[uid]) {
		let box = boats[uid].element;
		addMessage(`${name} has left the lobby.`, 'note');
		box.parentNode.removeChild(box);
		delete boats[uid];
	}
}

function serverRequest(url, callback) {
	const xmlhttp = new XMLHttpRequest();
	timeOut ++;
	if (timeOut > 10) window.location.replace("/accounts.php?target=/multi/quacken.php&m=Connection%20timed%20out");

	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			timeOut = 0;
			if (callback && this.responseText) callback(this.responseText);
		}
	};

	xmlhttp.open("GET", url);
	xmlhttp.send();
}

function readyButton() {
	document.getElementById('go').disabled = true;
	freezeMyMoves = true;
	waitingForTurn = true;
	getUpdates();
}

function ready() {
	document.getElementById('go').disabled = true;
	freezeMyMoves = true;
	timerLock = true;
	waitingForTurn = true;
}

function startTurn(turnString) {
  const turnsLeft =  90 - turnString[3];
  turn = JSON.parse(turnString[1]);

	if (blurred) {
		clearMyMoves();
		endTurn();
	} else {
		step = 0;
		document.getElementById('go').disabled = true;
		stepBoats();
	}

  if (turnsLeft !== 90) timer = turnsLeft * 20;
  else timer = 0;

  timer--;
  if (timer > 0) timerLock = false;
  else setTimeout(startNewRound, 6000);

  waitingForTurn = false;
	updateTreasure(JSON.parse( turnString[2] ));
}

function endTurn() {
	for (let boatSync of turn[8]) {
		const [uid, face, x, y, treasure, damage] = boatSync;
		const boat = boats[uid];
		if (!boat) continue;

		boat.image.style.transition = '0s';
		boat.image.style.transform = 'rotate(' + face * 90 + 'deg)';
		boat.image.style.opacity = 1;
		boat.element.style.transition = '0s';
		boat.element.style.opacity = 1;
		boat.setPos(x, y, false)
			.setTreasure(treasure)
			.setDamage(damage)
			.draw();
	}

	if (timer > 0) document.getElementById('go').disabled = false;
}

function stepBoats() {
	const move = turn[step];
	const nextMove = turn[step + 1].length;
	let time = nextMove ? 750 : 250;

	for (let boatUpdate of move) {
		const [uid, direction, move, x, y, treasure, crunchDir, damage] = boatUpdate;
		const boat = boats[uid];
		if (!boat) continue;

		if (move && move != 2) boat.rotate(move - 2);
		if (typeof crunchDir === 'number') boat.addDamage(crunchDir, damage);
		boat.setTransition(direction, move)
			.setTreasure(treasure)
			.setPos(x, y)
			.draw();
	}

	step++;
	if (step === 4) clearMyMoves();
	animateTimeout = step < 8 ? setTimeout(stepBoats, time) : setTimeout(endTurn, 1500);
}

function updateTreasure(treasure) {
	for (let x = 0; x < 4; x++) {
		document.getElementById('treasure' + x).innerHTML = treasure[x];
	}
}


function updateMyTreasure(treasure) {
	const box = document.getElementById('treasurebox');
	if (box.firstChild) box.removeChild(box.firstChild);
	if (treasure) box.appendChild(document.getElementById('obstacle' + treasure).cloneNode(true));
}

function updateMyDamage(damage) {
	document.getElementById('damagemeter').value = damage;
	document.getElementById('damagemeter').innerHTML = damage;
}

function clearMyMoves() {
	const tiles = document.getElementsByClassName("moves");
	boats[myBoat].moves = [0,0,0,0];
	freezeMyMoves = timer < 0;

	for (let tile of tiles) {
		if (tile.firstChild) tile.removeChild(tile.firstChild);
	}
}

function clickTile(ev) {
	if (freezeMyMoves) return;
	const box = ev.target.className == "tiles" ? ev.target.parentNode : ev.target;
	let move = box.firstChild ? +box.firstChild.name[4] : 0;

	if (move) box.removeChild(box.firstChild);
	move = (ev.which + move) % 4;
	boats[myBoat].moves[box.id[4]] = move;

	if (!move) return;
	box.appendChild(document.getElementById('tile' + move).cloneNode(true));
	box.firstChild.id = box.name;
}

function drag(ev) {
	ev.dataTransfer.setData("text/plain", ev.target.name);
	ev.dataTransfer.setData("text/html", ev.target.parentNode.id);
}

function drop(ev) {
	if (freezeMyMoves) return;
	const move = ev.dataTransfer.getData("text/plain");
	const source = ev.dataTransfer.getData("text/html");
	const box = ev.target.className == "tiles" ? ev.target.parentNode : ev.target;
	ev.preventDefault();

	if(box.firstChild) {
		if(source != "movesource") {
			document.getElementById(source).appendChild(box.firstChild);
		} else {
			box.removeChild(box.firstChild);
		}
	}
	boats[myBoat].moves[box.id[4]] = +move[4];
	box.appendChild(document.getElementById(move).cloneNode(true));
	box.firstChild.id = box.name;
}

function dragEnd(ev) {
	if (freezeMyMoves) return;
	const box = ev.target.parentNode;

	if (box.className == "moves") {
		box.removeChild(box.firstChild);
		boats[myBoat].moves[box.id[4]] = box.firstChild ? +box.firstChild.name[4] : 0;
	}
}
