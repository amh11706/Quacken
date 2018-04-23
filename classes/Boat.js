function Boat(uid, name, x, y, face = 0) {
	const dragMap = document.getElementById('dragmap');
	this.x = +x;
	this.y = +y;
	this.damage = 0;
	this.isMe = false;
	
	dragMap.appendChild(document.getElementById('boat').cloneNode(true));
	this.element = dragMap.lastChild;
	this.element.id = "boat" + uid;
	this.element.firstElementChild.firstElementChild.innerHTML = name;
	this.element.firstElementChild.firstElementChild.title = name;
	this.image = this.element.lastElementChild;
	
	this.moveBar = this.element.firstElementChild.lastElementChild.children;
	this.image.style.transform = 'rotate(' + face * 90 + 'deg)';
	this.draw();
}

Boat.prototype = {
	draw: function(offsetX = 0, offsetY = 0) {
		this.element.style.bottom = (51 - this.y - offsetY) * 50 + 'px';
		this.element.style.left = (this.x + offsetX) * 50 + 'px';
		return this;
	},
	
	rotate: function(by) {
		const rotation = this.image.style.transform;
		let deg = +rotation.substring(7, rotation.length - 4);
		
		deg += (by) * 90;
		this.image.style.transform = 'rotate(' + deg + 'deg)';
		if (blurred) return this;
		this.image.style.transition = '.4s ease .1s';
		return this;
	},
	
	setPos: function(x, y, checkSZ = true) {
		if ( checkSZ && this._checkSZ(x, y) && !this._checkSZ(this.x, this.y) ) this._enterSZ();
		this.x = x;
		this.y = y;
		return this;
	},
	
	setTransition: function(transition, move) {
		if (move == 2) this.element.style.transition = '.5s linear';
		else if (transition % 2) this.element.style.transition = 'bottom .5s ease-out, left .5s ease-in .05s';
		else this.element.style.transition = 'bottom .5s ease-in .05s, left .5s ease-out';
		return this;
	},
	
	setTreasure: function(treasure) {
		if (this.treasure == treasure) return this;
		if (this.isMe) updateMyTreasure(treasure);
		this.treasure = treasure;
		return this;
	},
	
	setDamage: function(damage) {
		this.damage = damage;
		if (this.isMe) updateMyDamage(damage);
		if (this.damage >= 3) setTimeout(() => this._sink(), 200);
		return this;
	},
	
	addDamage: function(crunchDir, damage = 1) {
		this.setDamage(this.damage + damage);
		if (!blurred) setTimeout(() => this._crunch(crunchDir, damage), 100);
		return this;
	},
	
	_crunch: function(direction, damage) {
		const decodeX = [0, 1, 0, -1], decodeY = [-1, 0, 1, 0];
		this.element.style.transition = '.1s';
		this.draw(decodeX[direction] * 0.1, decodeY[direction] * 0.1);
		setTimeout(() => this.draw(), 110);
	},
	
	_sink: function() {
		this.rotate(8);
		this.image.style.transition = '3s linear';
		this.image.style.opacity = 0;
	},
	
	_checkSZ: function(x, y) {
		return y > 48 && y < 52 && x >= 0 && x < 25;
	},
	
	_enterSZ: function() {
		this.element.style.transition += ', opacity .8s linear .7s';
		this.element.style.opacity = 0;
	}
}