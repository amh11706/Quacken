function Dragable(dragElement, dragFrame) {
	this.startY = 0;
	this.startX = 0;
	this.offsetX = 0;
	this.offsety = 0;
	this.dragElement = dragElement;
	this.dragFrame = dragFrame;
	
	dragFrame.onmousedown = event => this.onDown(event);
}

Dragable.prototype = {
	onDown: function(event) {
		document.onmousemove = event => this.onMove(event);
		document.onmouseleave = event => this.onUp(event);
		document.onmouseup = event => this.onUp(event);
		event.preventDefault();
	
		this.startX = event.clientX;
		this.startY = event.clientY;
		this.offsetX = this.dragElement.offsetLeft;
		this.offsetY = this.dragElement.offsetTop;
	},

	onMove: function(event) {
		this.dragElement.style.left = (this.offsetX + event.clientX - this.startX) + 'px';
		this.dragElement.style.top = (this.offsetY + event.clientY - this.startY) + 'px';
	},

	onUp: function() {
		document.onmousemove = null;
		document.onmouseleave = null;
		document.onmouseup = null;
	}
}