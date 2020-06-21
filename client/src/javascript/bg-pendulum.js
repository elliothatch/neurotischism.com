(function(window) {

	var PendulumAnimation = function(gallery) {
		this.gallery = gallery;
	};

	PendulumAnimation.prototype.init = function() {
		this.gallery.canvas.style.background = '#000000';

		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.pendulumOffset = 0.1*this.gallery.height;
		this.pendulumLength = 0.8*this.gallery.height + this.pendulumOffset;
		this.pendulumPeriod = 1/3;
		this.pendulumAmplitude = Math.PI/6;
	};

	PendulumAnimation.prototype.draw = function(t, deltaT)
	{
		//this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		var timeStep = 1000/120;

		// draw missed frames
		for(var currentT = t - deltaT; currentT < t; currentT += timeStep) {
			// small angle approximation
			var theta = this.pendulumAmplitude * Math.cos((currentT/1000) * this.pendulumPeriod*(2*Math.PI));
			var color = {
				h: (currentT/1000)*(2*this.pendulumPeriod)/4,
				s: 1,
				v: 1
			};
			this.drawPendulum(theta, this.pendulumLength, this.pendulumPeriod, color);
		}

	};

	PendulumAnimation.prototype.drawPendulum = function(theta, length, period, color) {
		var pendulumRadius = 60;
		var outlineWidth = 5;
		var innerWidth = 5;
			
		var pendulumP1 = {
			x: this.gallery.width / 2,
			y: -this.pendulumOffset
		};
		var pendulumP2 = {
			x: pendulumP1.x + (length - pendulumRadius + outlineWidth/2) * Math.sin(theta),
			y: pendulumP1.y + (length - pendulumRadius + outlineWidth/2) * Math.cos(theta)
		};
		var pendulumCenter = {
			x: pendulumP1.x + length * Math.sin(theta),
			y: pendulumP1.y + length * Math.cos(theta)
		};
		var outlineColor = this.gallery.helpers.HSVtoRGBStr(color.h, color.s, color.v);
		var innerColor = this.gallery.helpers.HSVtoRGBStr(color.h + 0.5, color.s, color.v);

		// draw bob
		this.gallery.ctx.beginPath();
		this.gallery.ctx.arc(pendulumCenter.x, pendulumCenter.y, pendulumRadius, 0, 2*Math.PI);
		this.gallery.ctx.closePath();

		this.gallery.ctx.fillStyle = innerColor;
		this.gallery.ctx.fill();

		this.gallery.ctx.lineWidth = outlineWidth;
		this.gallery.ctx.strokeStyle = outlineColor;
		this.gallery.ctx.stroke();

		// draw rope
		this.gallery.ctx.beginPath();
		this.gallery.ctx.moveTo(pendulumP1.x, pendulumP1.y);
		this.gallery.ctx.lineTo(pendulumP2.x, pendulumP2.y);
		this.gallery.ctx.closePath();

		this.gallery.ctx.lineWidth = innerWidth + outlineWidth*2;
		this.gallery.ctx.strokeStyle = outlineColor;
		this.gallery.ctx.stroke();

		this.gallery.ctx.lineWidth = innerWidth;
		this.gallery.ctx.strokeStyle = innerColor;
		this.gallery.ctx.stroke();

	};

	window.AnimationGallery.addAnimation('pendulum', PendulumAnimation);
})(window);
