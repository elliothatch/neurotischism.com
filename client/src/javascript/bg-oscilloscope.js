(function(window) {

	var OscilloscopeAnimation = function(gallery) {
		this.gallery = gallery;
	};

	OscilloscopeAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
	};

	OscilloscopeAnimation.prototype.draw = function(t, deltaT)
	{
		//this.gallery.ctx.fillStyle = this.gallery.helpers.rgbaStr(0,0,0,0.01*deltaT);
		this.gallery.ctx.fillStyle = 'black';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		// var sweepFrequency = 1;
		var sweepFrequency = this.gallery.helpers.lerp(1, 110, this.gallery.mouseX/this.gallery.width);
		//var sweepSpeed = this.gallery.helpers.lerp(1/10, 10, this.gallery.mouseX/this.gallery.width);
		//var sweepSpeed = Math.pow(2, this.gallery.helpers.lerp(-1, 8, this.gallery.mouseX/this.gallery.width));

		var fadeTime = 200;
		var timeStep = 1;
		// var timeStep = 10;

		var displayWidth = this.gallery.width;
		var displayHeight = this.gallery.height;

		this.gallery.ctx.lineWidth = 2;

		var lastCursorPos = null;

		for(var signalT = t; signalT > t - fadeTime; signalT -= timeStep) {
			var sweepPosition = (sweepFrequency*signalT/1000) % 1;

			var cursorPos = {
				x: sweepPosition*displayWidth,
				y: this.signalValue(signalT)*displayHeight*0.8 + displayHeight * (1-0.8)/2
			};

			if(!lastCursorPos) {
				lastCursorPos = cursorPos;
				continue;
			}

			var brightness = 1 - ((t - signalT)/fadeTime);

			this.gallery.ctx.strokeStyle = this.gallery.helpers.rgbaStr(255, 20, 20, brightness);

			// if the line wraps, split it into two segments that connect to each edge
			if(cursorPos.x > lastCursorPos.x) {
				var midY = this.gallery.helpers.lerp(cursorPos.y, lastCursorPos.y, 1 - lastCursorPos.x/(displayWidth-cursorPos.x + lastCursorPos.x));
				this.gallery.ctx.beginPath();
				this.gallery.ctx.moveTo(0, midY);
				this.gallery.ctx.lineTo(lastCursorPos.x, lastCursorPos.y);
				this.gallery.ctx.stroke();

				this.gallery.ctx.beginPath();
				this.gallery.ctx.moveTo(this.gallery.width, midY);
				this.gallery.ctx.lineTo(cursorPos.x, cursorPos.y);
				this.gallery.ctx.stroke();
			}
			else {
				this.gallery.ctx.beginPath();
				this.gallery.ctx.moveTo(lastCursorPos.x, lastCursorPos.y);
				this.gallery.ctx.lineTo(cursorPos.x, cursorPos.y);
				this.gallery.ctx.stroke();
			}

			lastCursorPos = cursorPos;
		}

	};

	OscilloscopeAnimation.prototype.signalValue = function(t) {
		const frequency = 100;
		return 0.5*(Math.sin(frequency*t/1000 * 2*Math.PI)+1);
	};

	window.AnimationGallery.addAnimation('oscilloscope', OscilloscopeAnimation);
})(window);
