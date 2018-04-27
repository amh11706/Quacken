class Dragable {
	constructor(dragElement, dragFrame) {
		this.startY = 0;
		this.startX = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.dragElement = dragElement;

		dragFrame.onmousedown = event => this.onDown(event);
	}

	onDown(event) {
		document.onmousemove = event => this.onMove(event);
		document.onmouseleave = event => this.onUp(event);
		document.onmouseup = event => this.onUp(event);
		event.preventDefault();

		this.startX = event.clientX;
		this.startY = event.clientY;
	}

	onMove(event) {
		this.offsetX += event.clientX - this.startX;
		this.offsetY += event.clientY - this.startY;
		this.startX = event.clientX;
		this.startY = event.clientY;
		this.dragElement.style.transform = `translate(${this.offsetX}px,${this.offsetY}px)`;
	}

	onUp() {
		document.onmousemove = null;
		document.onmouseleave = null;
		document.onmouseup = null;
	}
}
