(function(window) {

	var GlobeAnimation = function(gallery) {
		this.gallery = gallery;
	};

	GlobeAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
	};

	GlobeAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.drawSun(this.gallery.width/2, this.gallery.height/2, t);
	};

	GlobeAnimation.prototype.drawSun = function(x, y, t) {
		var ringCount = 30;
		var mouseSpinT = (Math.pow(this.gallery.mouseX/this.gallery.width - 0.5, 2) + Math.pow(this.gallery.mouseY/this.gallery.height - 0.5, 2) + 0.5) % 1;

		for(var i = 0; i < ringCount; i++) {
			var ringAngle = i*2*Math.PI/ringCount;
			var spinOffset = i*this.gallery.helpers.lerp(-0.25,0.25, mouseSpinT);

			var radius = this.gallery.height/2*0.9;
			//var xRadius = radius*(Math.cos(2*t/1000+spinOffset)/2 + 0.5) + 5;
			var xRadius = radius*Math.abs(Math.cos(t/1000+spinOffset)) + 5;
			//var yRadius = 70*(Math.sin(t/1000)/2 + 0.5);
			var yRadius = radius;

			this.gallery.ctx.strokeStyle = this.gallery.helpers.HSVtoRGBStr(i/ringCount, 0.8, 0.8);
			//this.gallery.ctx.strokeStyle = this.gallery.helpers.rgbStr(255, 138, 24);
			this.gallery.ctx.lineWidth = 2;
			//this.gallery.ctx.lineWidth = 5;

			this.gallery.ctx.beginPath();
			this.gallery.ctx.ellipse(x , y, xRadius, yRadius, ringAngle, 0, 2*Math.PI);
			this.gallery.ctx.closePath();
			this.gallery.ctx.stroke();
		}
	};

	window.AnimationGallery.addAnimation('globe', GlobeAnimation);
})(window);
