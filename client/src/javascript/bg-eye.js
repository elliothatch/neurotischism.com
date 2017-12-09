(function(window) {

	var EyeAnimation = function(gallery) {
		this.gallery = gallery;
	};

	EyeAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.transitionT = 0;
	};

	EyeAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillStyle = '#000';
		//this.gallery.ctx.fillStyle = '#fff';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		var linkTransitionTime = 0.2;
		if(this.gallery.linkHovered) {
			this.transitionT = Math.min(this.transitionT + deltaT/1000 / linkTransitionTime, 1);
		}
		else {
			this.transitionT = Math.max(this.transitionT - deltaT/1000 / linkTransitionTime, 0);
		}

		//top lid
		//var lidColor = this.gallery.helpers.HSVtoRGB(Math.random(), 0.8, 0.8);
		var eyeT = t/600 / (2*Math.PI) + 0.5;
		var blinkPeriod = 4;
		//if(this.gallery.linkHovered && eyeT % blinkPeriod > 1) {
		//	eyeT = (eyeT % 1) + blinkPeriod-1;
		//}
		var blinkHeight = this.gallery.height*0.35;
		var squintHeight = 40;
		var eyePos = {
			left: 50,
			right: this.gallery.width - 50,
			top: -this.gallery.height/3,
			bottom: this.gallery.height + this.gallery.height/3,
			centerX: this.gallery.width/2,
			centerY: this.gallery.height/2,

			lidTop: -Math.cos(eyeT*2*Math.PI)*blinkHeight*1.1+(blinkHeight*1.1-squintHeight),
			lidTopBlink: -Math.cos(eyeT*2*Math.PI)*squintHeight-this.gallery.height,
		};

		this.gallery.ctx.beginPath();
		this.gallery.ctx.moveTo(eyePos.left, eyePos.centerY);
		this.gallery.ctx.fillStyle = '#fff';
		//this.gallery.ctx.fillStyle = 'rgb(237, 251, 255)';
		//this.gallery.ctx.fillStyle = 'rgb(255, 240, 240)';

		//this.gallery.ctx.fillStyle = this.gallery.helpers.hsvStr((t%1000)/1000,0.1,1);
		this.gallery.ctx.quadraticCurveTo(
			eyePos.centerX,
			eyePos.top,
			eyePos.right,
			eyePos.centerY
		);

		this.gallery.ctx.quadraticCurveTo(
			eyePos.centerX,
			eyePos.bottom,
			eyePos.left,
			eyePos.centerY
		);

		this.gallery.ctx.closePath();
		this.gallery.ctx.fill();
		/*
		if(eyeT % blinkPeriod <= 1) {
			this.gallery.ctx.quadraticCurveTo(
				eyePos.centerX,
				eyePos.lidTop,
				eyePos.left,
				eyePos.centerY
			);
		}
		else {
			this.gallery.ctx.quadraticCurveTo(
				eyePos.centerX,
				this.gallery.helpers.lerp(
					eyePos.lidTopBlink,
					eyePos.lidTopBlink*1.2,
					this.transitionT)+this.gallery.height,
				eyePos.centerY
			);
		}*/


		//var pupilRadius = 70;
		//var innerIrisRadius = 100;
		//var outerRadius = 250;

		var pupilRadius = this.gallery.height*0.9*0.07;
		var innerIrisRadius = this.gallery.height*0.9*0.100;
		var outerRadius = this.gallery.height*0.9*0.250;

		pupilRadius = this.gallery.helpers.lerp(pupilRadius, pupilRadius * 1.6, this.transitionT);
		innerIrisRadius = this.gallery.helpers.lerp(innerIrisRadius, innerIrisRadius * 1.6, this.transitionT);
		
		//var angle = t * 3.1 * Math.PI / 180;
		//var r = Math.floor((t/360) * 255);
		//var g = Math.floor((0.5*Math.sin(angle) + 0.5) * 255);
		//var b = Math.floor((1.0) * 255);

		var lookDirection = Math.atan2(this.gallery.mouseY-this.gallery.height/2, this.gallery.mouseX-this.gallery.width/2);
		var lookDistance = Math.pow(Math.pow(this.gallery.mouseX-this.gallery.width/2,2) + Math.pow(this.gallery.mouseY-this.gallery.height/2,2), 2/5);
		//iris and pupil
		var pupilCenter = {
			x: this.gallery.width/2 + lookDistance*Math.cos(lookDirection) + Math.random()*this.transitionT*15,
			y: this.gallery.height/2 + lookDistance*Math.sin(lookDirection) + Math.random()*this.transitionT*15
		};

		this.gallery.ctx.strokeStyle = '#000';
		this.gallery.ctx.lineWidth = 5;
		//ctx.fillStyle = '#fff';
		//ctx.arc(pupilCenter.x, pupilCenter.y, outerRadius, 0, 2*Math.PI);
		var pupilCount = 10 + this.transitionT*5;
		for(var i = 0; i < pupilCount; i++) {
			this.gallery.ctx.beginPath();
			this.gallery.ctx.arc(pupilCenter.x, pupilCenter.y, this.gallery.helpers.lerp(0,pupilRadius,i/pupilCount)+Math.random()*3, 0, 2*Math.PI);
			this.gallery.ctx.stroke();
			this.gallery.ctx.closePath();
		}

		this.gallery.ctx.lineWidth = 2;
		var irisCount = 360;
		//iris
		for(i = 0; i < irisCount; i++) {
			var color = this.gallery.helpers.HSVtoRGB(Math.random() * 0.1 + 0.8, 0.8, 0.8);
			var radius = innerIrisRadius + Math.random()*40;
			this.gallery.ctx.strokeStyle = this.gallery.helpers.rgbStr(color.r, color.g, color.b);
			this.gallery.ctx.beginPath();
			this.gallery.ctx.moveTo(pupilCenter.x + pupilRadius*Math.cos(i*Math.PI/180), pupilCenter.y + pupilRadius*Math.sin(i*Math.PI/180));
			this.gallery.ctx.lineTo(pupilCenter.x + radius*Math.cos(i*Math.PI/180), pupilCenter.y + radius*Math.sin(i*Math.PI/180));
			this.gallery.ctx.closePath();
			this.gallery.ctx.stroke();

			radius = outerRadius + Math.random()*10;
			color = this.gallery.helpers.HSVtoRGB(Math.random() * 0.1, 0.8, 0.8);
			this.gallery.ctx.strokeStyle = this.gallery.helpers.rgbStr(color.r, color.g, color.b);
			this.gallery.ctx.beginPath();
			this.gallery.ctx.moveTo(pupilCenter.x + pupilRadius*Math.cos(i*Math.PI/180+.01), pupilCenter.y + pupilRadius*Math.sin(i*Math.PI/180));
			this.gallery.ctx.lineTo(pupilCenter.x + radius*Math.cos(i*Math.PI/180+.01), pupilCenter.y + radius*Math.sin(i*Math.PI/180));
			this.gallery.ctx.closePath();
			this.gallery.ctx.stroke();
		}

		/*
		var r = Math.floor(Math.random() * 255);
		var g = Math.floor(Math.random() * 255);
		var b = Math.floor(Math.random() * 255);
		ctx.strokeStyle = rgb(r,g,b);
		ctx.beginPath();
		ctx.moveTo(pupilCenter.x, pupilCenter.y);
		ctx.lineTo(Math.sin(angle) * outerRadius + pupilCenter.x, Math.cos(angle) * outerRadius + pupilCenter.y);
		ctx.closePath();
		ctx.stroke();
		ctx.strokeStyle = rgb(Math.floor(g/15),Math.floor(b/5),Math.floor(r/5));
		ctx.beginPath();
		ctx.moveTo(pupilCenter.x, pupilCenter.y);
		ctx.lineTo(Math.sin(angle) * innerRadius + pupilCenter.x, Math.cos(angle) * innerRadius + pupilCenter.y);
		ctx.closePath();
		ctx.stroke();
		*/
		//ctx.fillStyle = "#000000";
		//ctx.arc()

		//var lidColor = 'rgb(164, 198, 219)';
		//var lidColor = 'rgb(180, 219, 164)';
		var lidColor = '#ccc';
		//bottom lid
		this.gallery.ctx.strokeStyle = this.gallery.helpers.rgbStr(0,0,0);
		this.gallery.ctx.fillStyle = lidColor;
		this.gallery.ctx.beginPath();
		this.gallery.ctx.moveTo(eyePos.left, eyePos.centerY);
		this.gallery.ctx.quadraticCurveTo(this.gallery.width/2, this.gallery.height+this.gallery.height/3, eyePos.right, this.gallery.height/2);
		if(eyeT % blinkPeriod <= 1) {
			this.gallery.ctx.quadraticCurveTo(this.gallery.width/2, this.gallery.height-(-Math.cos(eyeT*2*Math.PI)*(blinkHeight/2) + (blinkHeight/2-squintHeight)), eyePos.left, this.gallery.height/2);
		} else {
			var controlPoint = this.gallery.height-(-Math.cos(eyeT*2*Math.PI)*squintHeight);
			this.gallery.ctx.quadraticCurveTo(this.gallery.width/2, this.gallery.helpers.lerp(controlPoint, controlPoint*1.2, this.transitionT), eyePos.left, this.gallery.height/2);
		}

		//[-b+b-s, b+b-s]
		//[-s, 2b-s]
		//[h-(-b+b-s), (b+b-s)]
		//[h-(-s), h-(2b-s)]
		this.gallery.ctx.closePath();
		this.gallery.ctx.stroke();
		this.gallery.ctx.fill();

		this.gallery.ctx.strokeStyle = this.gallery.helpers.rgbStr(0,0,0);
		this.gallery.ctx.fillStyle = lidColor;
		this.gallery.ctx.beginPath();
		this.gallery.ctx.moveTo(eyePos.left, eyePos.centerY);
		//top lid
		this.gallery.ctx.quadraticCurveTo(this.gallery.width/2, -this.gallery.height/3, eyePos.right, this.gallery.height/2);
		if(eyeT % blinkPeriod <= 1) {
			this.gallery.ctx.quadraticCurveTo(this.gallery.width/2, -Math.cos(eyeT*2*Math.PI)*blinkHeight*1.1+(blinkHeight*1.1-squintHeight), eyePos.left, this.gallery.height/2);
		} else {
			var controlPoint = -Math.cos(eyeT*2*Math.PI)*squintHeight;
			this.gallery.ctx.quadraticCurveTo(this.gallery.width/2, this.gallery.helpers.lerp(controlPoint-this.gallery.height, (controlPoint-this.gallery.height)*1.2, this.transitionT)+this.gallery.height, eyePos.left, this.gallery.height/2);
		}
		//this.gallery.ctx.quadraticCurveTo(this.gallery.width/2, Math.sin(t/100)*40, 0, this.gallery.height/2);
		this.gallery.ctx.closePath();
		this.gallery.ctx.stroke();
		this.gallery.ctx.fill();


	};

	window.AnimationGallery.addAnimation('eye', EyeAnimation);
})(window);
