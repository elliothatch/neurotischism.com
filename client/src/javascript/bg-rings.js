(function(window) {
	let screenshotTaken = false;
	var RingsAnimation = function(gallery) {
		this.gallery = gallery;
	};

	RingsAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
	};

	RingsAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		var ringCount = 30;
		var ringBaseThickness = 1;
		var ringThicknessPeriod = Math.PI*2;
		var ringThicknessAnimFreq = 0.001;
		var ringCurrentRadius = 10;
		var ringGap = 2;
		for(var i = 0; i < ringCount; i++) {
			//var thickness = Math.floor(ringBaseThickness * ((Math.sin(t*ringThicknessAnimFreq*(Math.pow(i+1,1/2)/ringCount)*Math.PI*2*ringThicknessPeriod)+1.5)/2.5));
			var timeEffect = 1/(Math.pow(Math.abs((Math.sin(t/1000)/2+0.5)-(i/ringCount)),2)+0.01);
			var thickness = Math.floor(Math.pow(i,1.4)) + timeEffect;
			var ringInnerRadius = ringCurrentRadius;
			ringCurrentRadius += thickness/2;
			this.gallery.ctx.lineWidth = thickness;

			var segmentCount = i+3;
			for(var j = 0; j < segmentCount; j++) {
				var spinPeriod = Math.sin(i*10)*8000;
				var baseSpinPeriod = 20000;
				if(spinPeriod > 0) {
					spinPeriod += baseSpinPeriod;
				}
				else {
					spinPeriod -= baseSpinPeriod;
				}
				var startAngle = (j/segmentCount + t/spinPeriod)*Math.PI*2 + i;
				var endAngle = startAngle+(1/segmentCount)*Math.PI*2 - (2/360/Math.PI*2);
				this.gallery.ctx.strokeStyle = window.AnimationGallery.helpers.hsvStr(timeEffect/200+0.3*(j/segmentCount),0.8,0.8);

				this.gallery.ctx.beginPath();
				this.gallery.ctx.arc(this.gallery.mouseX, this.gallery.mouseY, ringCurrentRadius, startAngle, endAngle);
				this.gallery.ctx.stroke();
			}

			var ringOuterRadius = ringCurrentRadius + thickness/2;

			//lines
			/*
			var lineCount = i+3;
			for(var j = 0; j < lineCount; j++) {
				var angle = (j/lineCount)*Math.PI*2 + i;
				this.gallery.ctx.strokeStyle = '#000';
				this.gallery.ctx.lineWidth = 2;
				this.gallery.ctx.beginPath();

				//console.log(this.gallery.mouseX+ringInnerRadius*Math.cos(angle), this.gallery.mouseY+ringInnerRadius*Math.sin(angle));
				//console.log(this.gallery.mouseX+ringOuterRadius*Math.cos(angle), this.gallery.mouseY+ringOuterRadius*Math.sin(angle));

				this.gallery.ctx.moveTo(this.gallery.mouseX+ringInnerRadius*Math.cos(angle), this.gallery.mouseY+ringInnerRadius*Math.sin(angle));
				this.gallery.ctx.lineTo(this.gallery.mouseX+ringOuterRadius*Math.cos(angle), this.gallery.mouseY+ringOuterRadius*Math.sin(angle));

				this.gallery.ctx.stroke();
			}
			*/
			ringCurrentRadius = ringOuterRadius + ringGap;
		}

		// TODO: move into take screenshot function or w/e
		// if(!screenshotTaken && t > 500) {
		// 	screenshotTaken = true;

		// 	this.gallery.canvas.toBlob((blob) => {
		// 		let newImg = document.createElement('img'),
		// 			url = URL.createObjectURL(blob);
		// 		console.log(url);

		// 		newImg.onload = function() {
		// 			// no longer need to read the blob so it's revoked
		// 			URL.revokeObjectURL(url);
		// 		};

		// 		newImg.src = url;
		// 		document.body.appendChild(newImg);

		// 	});
		// }
	};

	window.AnimationGallery.addAnimation('rings', RingsAnimation);
})(window);
