(function(window) {

	var MeltAnimation = function(gallery) {
		this.gallery = gallery;
	};

	MeltAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.velocities = {};
	};

	MeltAnimation.prototype.draw = function(t, deltaT)
	{
		//this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
		for(var y = 0; y < this.gallery.height; y++) {
			if(!this.velocities[y]) {
				this.velocities[y] = Math.random()*150 + 5;
			}
			this.drawMelt(t, y, this.velocities[y]);
		}
	};

	MeltAnimation.prototype.drawMelt = function(t, y, velocity) {

		var color = this.gallery.helpers.HSVtoRGBStr(1,1,1);
		this.gallery.ctx.lineWidth = 1;
		this.gallery.ctx.strokeStyle = color;

		this.gallery.ctx.beginPath();
		this.gallery.ctx.moveTo(0, y);
		this.gallery.ctx.lineTo(velocity*Math.log(t/1000*velocity), y);
		this.gallery.ctx.closePath();

		this.gallery.ctx.stroke();

	};

	window.AnimationGallery.addAnimation('melt', MeltAnimation);
})(window);
