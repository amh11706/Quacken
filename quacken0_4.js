let freezeMyMoves = false;
let waitingForTurn = false;
let blurred = false;
let timeOut = 0;
let step = 7;
let turn;
let animateTimeout;

const mapBox = new Dragable(
  document.getElementById('mapframe'),
  document.getElementById('mapbox')
);
const timeBox = new Dragable(
  document.getElementById('timer'),
  document.getElementById('timer')
);

document.addEventListener('visibilitychange', function() {
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

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey) return;
	if (event.key === 'Tab') event.preventDefault();
	document.getElementById('textinput').focus();
});

window.addEventListener('beforeunload', function() {
  fetch("leave.php?id=" + myBoat, { credentials: 'include' });
});

function syncTimer() {
	document.getElementById('timebar').style.transition = '';
  updateTimer();

	setTimeout(function() {
    document.getElementById('timebar').style.transition = '.9s linear';
  }, 100);
}

function tickTimer() {
  const seconds = timer % 20;
  if (seconds === 1) ready();
  if (seconds || (!waitingForTurn && timer)) timer--;

  updateTimer();
  getUpdates();
}

function updateTimer() {
  let seconds = timer % 60;
  if (seconds < 10) seconds = '0' + seconds;

  document.getElementById('turncount').innerHTML = Math.floor(timer / 60) + ':' + seconds;
	document.getElementById('timebar').style.transform = `translateY(-${seconds % 20 * 4 - 4}px)`;
}

function startNewRound() {
	addMessage('New round starting.');
  document.getElementById('go').disabled = false;
	freezeMyMoves = false;
	timer = 1800;
  updateTimer();
}

function drawMap(map) {
	const dragMap = document.getElementById("dragmap");
  const obstacles = document.querySelectorAll('.obstacle');

	for (let row = 0; row < 49; row++) {
		for (let column = 0; column < 25; column++) {
      const tile = document.createElement('div');
      tile.className = 'tile';

      if (map[row][column]) {
        tile.appendChild(obstacles[map[row][column] - 1].cloneNode());
      }

      dragMap.appendChild(tile);
		}
	}

	for (let tile = 0; tile < 75; tile++) {
    const tile = document.createElement('div');
    tile.className = 'tile sztile';
		dragMap.appendChild(tile);
	}
}

function sendInput (e) {
	const textBox = document.getElementById('textinput');
	const message = textBox.value;
	e.preventDefault();

	if (message) {
		textBox.value = '';
		message[0] === '/' ? sendCommand(message) : sendMessage(message);
	}
}

function sendMessage(message) {
	fetch(
    `messagesend.php?id=${myBoat}&m=${encodeURIComponent(message)}`,
    { credentials: 'include' }
  )
    .then(response => response.json())
    .then(response => addMessages(response[1]));
}

function sendCommand(message) {
	message = message.substring(1);

	if (message === 'exit') {
		serverRequest('leave.php?id=' + myBoat);
		setTimeout(function () {window.close();}, 100);
	} else if (message === 'clear') {
		document.getElementById('textbox').innerHTML = '';
	} else {
		fetch(
      `commandsend.php?m=${encodeURIComponent(message)}`,
      { credentials: 'include' }
    )
      .then(response => response.text())
      .then(addMessage);
	}
}

function getUpdates() {
	fetch(
    `messageupdate.php?id=${myBoat}&m=${boats[myBoat].moves.join('')}&r=${(waitingForTurn ? 1 : 0)}`,
    { credentials: 'include' }
  )
    .then(response => response.json())
    .then(parseResponse);
}

function parseResponse(response) {
	if (response === 'kick') {
    window.location.replace("/accounts.php?target=/multi/&m=Invalid%20Session");
  }

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
  if (!message) return;

	const box = document.getElementById('textbox');
	const autoScroll = box.scrollHeight < 100 || box.scrollTop + 110 > box.scrollHeight;

	let p = document.createElement('p');
	p.className = type;
	p.innerHTML = message;
	box.appendChild(p);

	if (autoScroll) box.scrollTop = box.scrollHeight - 100;
}

function tresSum(treasure) {
	const types = [' Cuttle Cake', ' Taco Locker', ' Pea Pod', ' Fried Egg'];
	let messageParts = [];
	treasure = JSON.parse(treasure);

	for (let x in treasure) {
		if (treasure[x]) {
      messageParts.push(treasure[x] + types[x] + (treasure[x] > 1 ? 's' : '' ));
    }
	}

	if (messageParts.length) {
    addMessage(`Round ended. Treasure count: ${messageParts.join(', ')}.`);
  } else {
    addMessage('Round ended. No treasure was loaded.');
  }
}

function updateMoves(allMoves) {
	for (let moves of allMoves) {
		const boat = boats[moves[0]];
		if (boat) boat.updateMoves(moves[1]);
	}
}

function addRemovePlayer(name, vars) {
	const [action, uid, x, y] = vars.split(' ');
	if (uid == myBoat) return;

	if (action === '>') {
		addMessage(`${name} has joined the lobby.`, 'note');
		boats[uid] = new Boat(uid, name, x, y);
	} else if (boats[uid]) {
		let box = boats[uid].element;
		addMessage(`${name} has left the lobby.`, 'note');
		box.parentNode.removeChild(box);
		delete boats[uid];
	}
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
	waitingForTurn = true;
}

function startTurn(turnString) {
  waitingForTurn = false;
  turn = JSON.parse(turnString[1]);

	if (blurred) {
		clearMyMoves();
		endTurn();
	} else {
		step = 0;
		document.getElementById('go').disabled = true;
    if (animateTimeout) clearTimeout(animateTimeout);
		stepTurn();
	}

  if (turnString[3] != 0) timer = (90 -turnString[3]) * 20;
  else {
    timer = 0;
    setTimeout(startNewRound, 5050);
  }

  updateTimer();
	updateTreasure(JSON.parse( turnString[2] ));
}

function endTurn() {
  animateTimeout = null;
  const turnSync = turn[8];

	for (let boatSync of turnSync) {
		const boat = boats[boatSync[0]];
		if (boat) boat.sync(...boatSync)
	}

	if (timer > 0) document.getElementById('go').disabled = false;
}

function stepTurn() {
  const move = turn[step];

	for (let boatUpdate of move) {
		const boat = boats[boatUpdate[0]];
		if (boat) boat.update(...boatUpdate);
	}

	step++;
  if (step === 4) clearMyMoves();
  const time = turn[step].length ? 750 : 250;
	animateTimeout = step < 8 ? setTimeout(stepTurn, time) : setTimeout(endTurn, 1500);
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
	document.getElementById('damagemeter').style.transform = `translateX(${damage * 30}px)`;
}

function clearMyMoves() {
	const tiles = Array.from(document.getElementById("moves").children);
	boats[myBoat].moves = [0,0,0,0];
	freezeMyMoves = timer < 0;

	for (let tile of tiles) {
		if (tile.firstChild) tile.removeChild(tile.firstChild);
	}
}

function clickTile(ev) {
	if (freezeMyMoves) return;
	const box = ev.target.className === "tiles" ? ev.target.parentNode : ev.target;
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
		if(source !== "movesource") {
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

	if (box.className === "moves") {
		box.removeChild(box.firstChild);
		boats[myBoat].moves[box.id[4]] = box.firstChild ? +box.firstChild.name[4] : 0;
	}
}
