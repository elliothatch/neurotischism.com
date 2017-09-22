(function(window) {

	var FlowerAnimation = function(gallery) {
		this.gallery = gallery;
		this.layerCount = 10;
	};

	FlowerAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#fff';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
	};

	FlowerAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillStyle = '#fff';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		var layerAngleOffset = 0;
		for(var i = this.layerCount-1; i >= 0; i--) {
			var petalCount = 2*i+3;
			for(var j = 0; j < petalCount; j++) {
				var petalLength = 100+i*80; // + 500*this.gallery.mouseY/this.gallery.height;
				var petalOffset = Math.PI*2/petalCount;
				var strokeColor = this.gallery.helpers.HSVtoRGBStr(0, 0.75 + 0.25*Math.sin(i), 1);
				var fillColor = this.gallery.helpers.HSVtoRGBStr(0, 0.5 + 0.25*Math.sin(i), 1);
				var petalWidthRatio = 1+Math.sin(Math.PI*4*this.gallery.mouseX/this.gallery.width);

				this.drawPetal(this.gallery.mouseX, this.gallery.mouseY, petalLength, petalWidthRatio, j*petalOffset+layerAngleOffset+ Math.sin(t*(this.layerCount-i)/5000), strokeColor, fillColor);
			}
			layerAngleOffset += 2*Math.PI/petalCount;
		}
	};

	FlowerAnimation.prototype.drawPetal = function(x, y, length, widthRatio, angle, strokeColor, fillColor) {
		var x2 = x + length*Math.cos(angle);
		var y2 = y + length*Math.sin(angle);
		var c1x = x + length*widthRatio*Math.cos(angle-Math.PI*1/3);
		var c1y = y + length*widthRatio*Math.sin(angle-Math.PI*1/3);
		var c2x = x + length*widthRatio*Math.cos(angle+Math.PI*1/3);
		var c2y = y + length*widthRatio*Math.sin(angle+Math.PI*1/3);

		this.gallery.ctx.fillStyle = fillColor;
		this.gallery.ctx.strokeStyle = strokeColor;

		this.gallery.ctx.beginPath();

		this.gallery.ctx.moveTo(x, y);
		this.gallery.ctx.quadraticCurveTo(c1x, c1y, x2, y2);

		this.gallery.ctx.moveTo(x, y);
		this.gallery.ctx.quadraticCurveTo(c2x, c2y, x2, y2);

		this.gallery.ctx.closePath();
		this.gallery.ctx.fill();
		this.gallery.ctx.stroke();
	};

	window.AnimationGallery.addAnimation('flower', FlowerAnimation);
})(window);
