class Dragable {
	constructor(dragElement, dragFrame) {
		this.startY = 0;
		this.startX = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.dragElement = dragElement;

		dragFrame.addEventListener('mousedown', this.onDown.bind(this));
		dragFrame.addEventListener('touchstart', this.touchStart.bind(this));
	}

	onDown(event) {
		dragging = this;
		document.addEventListener('mousemove', dragging.onMove);
		document.addEventListener('mouseleave', dragging.onUp);
		document.addEventListener('mouseup', dragging.onUp);
		event.preventDefault();

		this.startX = event.clientX;
		this.startY = event.clientY;
	}

	touchStart(event) {
		dragging = this;
		document.addEventListener('touchmove', dragging.touchMove);
		document.addEventListener('touchcancel', dragging.touchEnd);
		document.addEventListener('touchend', dragging.touchEnd);

		const touch = event.touches[0];
		this.startX = touch.clientX;
		this.startY = touch.clientY;
	}

	onMove(event) {
		dragging.offsetX += event.clientX - dragging.startX;
		dragging.offsetY += event.clientY - dragging.startY;
		dragging.startX = event.clientX;
		dragging.startY = event.clientY;
		dragging.dragElement.style.transform = `translate(${dragging.offsetX}px,${dragging.offsetY}px)`;
	}

	touchMove(event) {
		dragging.onMove(event.touches[0]);
	}

	onUp() {
		document.removeEventListener('mousemove', dragging.onMove);
		document.removeEventListener('mouseleave', dragging.onUp);
		document.removeEventListener('mouseup', dragging.onUp);
		dragging = null;
	}

	touchEnd() {
		document.removeEventListener('touchmove', dragging.touchMove);
		document.removeEventListener('touchcancel', dragging.touchEnd);
		document.removeEventListener('touchend', dragging.touchEnd);
		dragging = null;
	}
}
