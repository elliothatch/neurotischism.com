(function(window) {

	var TreeAnimation = function(gallery) {
		this.gallery = gallery;
		this.layerCount = 10;
	};

	TreeAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#fff';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
	};

	TreeAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillStyle = '#fff';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.drawBranch(this.gallery.mouseX, this.gallery.mouseY, 10, 200, -Math.PI/2, Math.PI/2, t, 10);
	};

	TreeAnimation.prototype.drawBranch = function(x, y, width, length, angle, splitAngle, t, subBranches) {
		this.gallery.ctx.strokeStyle = '#000';
		this.gallery.ctx.lineWidth = width;
		angle += 0.1*Math.sin(t/1000) + this.gallery.helpers.lerp(-2,2,this.gallery.mouseX/this.gallery.width)*Math.sin(subBranches);

		var x1 = x + length*Math.cos(angle);
		var y1 = y + length*Math.sin(angle);

		this.gallery.ctx.beginPath();
		this.gallery.ctx.moveTo(x,y);
		this.gallery.ctx.lineTo(x1, y1);
		this.gallery.ctx.closePath();
		this.gallery.ctx.stroke();

		if(subBranches > 0) {
			this.drawBranch(x1, y1, width*0.8, length*0.8, angle+splitAngle/2, splitAngle*0.8, t, subBranches-1);
			this.drawBranch(x1, y1, width*0.8, length*0.8, angle-splitAngle/2, splitAngle*0.8, t, subBranches-1);
		}
	};

	window.AnimationGallery.addAnimation('tree', TreeAnimation);
})(window);
