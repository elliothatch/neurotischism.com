(function(window) {

	var NauseaAnimation = function(gallery) {
		this.gallery = gallery;
	};

	NauseaAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#111';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.rook = {
			eyeWidth: 200,
			eyeHeight: 200
		};

		this.staticCanvas = document.createElement('canvas');
		this.staticIData = this.staticCanvas.getContext('2d').createImageData(this.rook.eyeWidth, this.rook.eyeHeight);
		this.staticBuffer = new Uint32Array(this.staticIData.data.buffer);

		if(!this.blackDressesSvg) {
			const img = new Image();
			img.onload = () => {
				this.blackDressesSvg = img;
			}
			img.src = '/svg/black-dresses-web.svg';
		}
	};

	NauseaAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillStyle = '#111';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.drawNausea(t, this.pendulumLength, this.pendulumPeriod, {h: 1, s: 1, v:1});
		this.drawDevi(t);
		this.drawRook(t);
	};

	NauseaAnimation.prototype.drawDevi = function(t) {
		this.gallery.ctx.fillStyle = '#fff';
		this.gallery.ctx.fillRect(0, 0, this.gallery.width/3, this.gallery.height);
	};


	NauseaAnimation.prototype.updateStatic = function() {
		let len = this.staticBuffer.length - 1;
		while(len--) {
			this.staticBuffer[len] = Math.random()<0.5? 0: -1>>0;
		}
		this.staticCanvas.getContext('2d').putImageData(this.staticIData, 0, 0);
	};

	NauseaAnimation.prototype.drawRook = function(t) {

		this.gallery.ctx.fillStyle = '#fff';
		this.gallery.ctx.fillRect(2*this.gallery.width/3, 0, this.gallery.width/3, this.gallery.height);

		var eyeT = t/600 / (2*Math.PI) + 0.5;

		const x = 5*this.gallery.width / 6;
		const y = this.gallery.height / 2;

		var blinkHeight = 50;
		var squintHeight = 40;

		const eyePos = {
			left: x - this.rook.eyeWidth/2,
			right: x + this.rook.eyeWidth/2,
			top: y - this.rook.eyeHeight/2,
			bottom: y + this.rook.eyeHeight/2,

			lidTop: -Math.cos(eyeT*2*Math.PI)*blinkHeight*1.1+(blinkHeight*1.1-squintHeight),
			lidTopBlink: -Math.cos(eyeT*2*Math.PI)*squintHeight-this.rook.eyeHeight
		};

		this.gallery.ctx.save();

		this.gallery.ctx.beginPath();
		this.gallery.ctx.moveTo(eyePos.left, y);

		this.gallery.ctx.quadraticCurveTo(
			x,
			eyePos.top,
			eyePos.right,
			y,
		);

		this.gallery.ctx.quadraticCurveTo(
			x,
			eyePos.bottom,
			eyePos.left,
			y,
		);

		this.gallery.ctx.closePath();
		this.gallery.ctx.lineWidth = 1;
		this.gallery.ctx.strokeStyle = '#000';
		this.gallery.ctx.stroke();
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fill();
		this.gallery.ctx.clip();

		this.updateStatic();
		this.gallery.ctx.drawImage(this.staticCanvas, eyePos.left, eyePos.top);
		this.gallery.ctx.restore();
		// this.gallery.ctx.fill();
	};

	NauseaAnimation.prototype.drawNausea = function(t) {
		this.drawSpiral({x: this.gallery.width/2, y: this.gallery.height/2}, -2*Math.PI*t/8000, 19, {h: 1, s: 0, v: 1});
	};

	NauseaAnimation.prototype.drawSpiral = function(position, theta, edgeCount, color) {
		if(this.blackDressesSvg) {
			this.gallery.ctx.save();
			// this.gallery.ctx.drawImage(this.blackDressesSvg, this.gallery.width/2, this.gallery.height/2);
			// this.gallery.ctx.drawImage(this.blackDressesSvg, 0, 0);
			this.gallery.ctx.translate(this.gallery.width/2, this.gallery.height/2);
			this.gallery.ctx.rotate(-theta/2);
			this.gallery.ctx.drawImage(
				this.blackDressesSvg,
				-this.blackDressesSvg.width*0.7/2,
				-this.blackDressesSvg.height*0.7/2,
				this.blackDressesSvg.width*0.7,
				this.blackDressesSvg.height * 0.7
			);

			this.gallery.ctx.restore();
		}

		const minWidth = 20;
		const maxWidth = 60;
		const spiralRate = 20;
		const rotations = 4;
		const points = [];
		for(let i = 0; i < edgeCount; i++) {
			const t = i*(rotations*2*Math.PI / edgeCount) + theta;
			const r = (t-theta)*spiralRate;

			const x = r*Math.cos(t) + position.x;
			const y = r*Math.sin(t) + position.y;

			const width = (i%2)*(maxWidth - minWidth) + minWidth;

			// convert spiral points to 2 points on edge of trapezoid
			points.push([{
					x: x - width/2*Math.cos(t),
					y: y - width/2*Math.sin(t),
				}, {
					x: x + width/2*Math.cos(t),
					y: y + width/2*Math.sin(t),
				}
			]);
		}

		this.gallery.ctx.save();
		// this.gallery.ctx.globalCompositeOperation = 'lighter';
		// this.gallery.ctx.globalCompositeOperation = 'screen';
		// this.gallery.ctx.globalCompositeOperation = 'lighten';

		for(let i = 0; i < points.length - 1; i++) {
			const p1 = points[i];
			const p2 = points[i+1];

			this.gallery.ctx.beginPath();
			this.gallery.ctx.moveTo(p1[0].x, p1[0].y);
			this.gallery.ctx.lineTo(p1[1].x, p1[1].y);
			this.gallery.ctx.lineTo(p2[1].x, p2[1].y);
			this.gallery.ctx.lineTo(p2[0].x, p2[0].y);
			this.gallery.ctx.closePath();

			this.gallery.ctx.fillStyle = this.gallery.helpers.HSVAtoRGBAStr(color.h, color.s, color.v, 1);
			this.gallery.ctx.globalCompositeOperation = 'overlay';
			this.gallery.ctx.fill();
			this.gallery.ctx.fillStyle = this.gallery.helpers.HSVAtoRGBAStr(color.h, color.s, color.v, 0.3);
			this.gallery.ctx.globalCompositeOperation = 'lighten';
			this.gallery.ctx.fill();
		}

		this.gallery.ctx.restore();
	};

	window.AnimationGallery.addAnimation('nausea', NauseaAnimation);
})(window);
