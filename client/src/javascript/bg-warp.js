(function(window) {
	var WarpAnimation = function(gallery) {
		this.gallery = gallery;
	};

	WarpAnimation.prototype.init = function() {
		this.gallery.canvas.style.background = '#000000';

		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
		//var aspectRatio = this.gallery.width / this.gallery.height;
		this.lastMouseX = this.gallery.mouseX;
		this.lastMouseY = this.gallery.mouseY;
		this.warpStep = 0;

		this.linkHoveredLast = this.gallery.linkHovered;
		this.linkX = null;
		this.linkY = null;

	};

	WarpAnimation.prototype.draw = function(t, deltaT)
	{
		if(this.gallery.linkHovered) {
			if(this.gallery.linkHovered !== this.linkHoveredLast) {
				var pos = this.gallery.linkHovered.target.getBoundingClientRect();
				this.linkX = pos.left + (pos.right - pos.left)/2;
				this.linkY = pos.top + (pos.bottom - pos.top)/2;
			}
			this.drawText(this.linkX, this.linkY, this.gallery.linkT/1000 * 10);
		}

		this.linkHoveredLast = this.gallery.linkHovered;

		if(this.lastMouseX !== this.gallery.mouseX || this.lastMouseY !== this.gallery.mouseY) {
			this.drawWarp(this.gallery.mouseX, this.gallery.mouseY, this.warpStep);
			this.warpStep++;
		}

		this.lastMouseX = this.gallery.mouseX;
		this.lastMouseY = this.gallery.mouseY;
	};

	WarpAnimation.prototype.drawText = function(x, y, t) {
		var fontSize = t*20;
		this.gallery.ctx.font = fontSize + 'px serif';

		this.gallery.ctx.fillStyle = this.gallery.helpers.hsvStr(((x+y)/(this.gallery.width+this.gallery.height)+(t*0.1))%1, 0.6, 0.9);
		var linkText = this.gallery.linkHovered.target.textContent;
		var textSize = this.gallery.ctx.measureText(linkText);
		this.gallery.ctx.fillText(linkText, this.linkX - textSize.width/2, this.linkY + fontSize/4);
	};

	WarpAnimation.prototype.drawWarp = function(x, y, step) {
		for(var i = 0; i < 50; i++) {
			this.gallery.ctx.strokeStyle = this.gallery.helpers.hsvStr(((x+y)/(this.gallery.width+this.gallery.height)+(step*0.01+i*0.005))%1, 0.8, 0.5);
			this.gallery.ctx.beginPath();
			var size = Math.pow(i+5,2);// + 100*Math.sin(t/10) + 100;
			if(i % 2 === 0) {
				this.gallery.ctx.arc(x,y, size, 0, 2*Math.PI);
			} else {
				this.gallery.ctx.rect(x-size/2,y-size/2, size, size);
			}
			this.gallery.ctx.stroke();
		}
	};

	window.AnimationGallery.addAnimation('warp', WarpAnimation);
})(window);
