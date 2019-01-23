(function(window) {

	var BubblesAnimation = function(gallery) {
		this.gallery = gallery;
	};

	BubblesAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
		//var aspectRatio = this.gallery.width / this.gallery.height;

		this.bgGradient = this.gallery.ctx.createLinearGradient(this.gallery.width/2, 0, this.gallery.width/2, this.gallery.height);
		this.bgGradient.addColorStop(0, '#FF81E4');
		this.bgGradient.addColorStop(1/4, '#D675E8');
		this.bgGradient.addColorStop(2/4, '#CF8EFF');
		this.bgGradient.addColorStop(3/4, '#9875E8');
		this.bgGradient.addColorStop(4/4, '#8481FF');

		var fgGradientLoops = 2;
		var fgStopCount = fgGradientLoops*5-1;
		this.fgGradient = this.gallery.ctx.createLinearGradient(this.gallery.width/2, 0, this.gallery.width/2, this.gallery.height);
		for(var i = 0; i < fgGradientLoops; i++) {
			this.fgGradient.addColorStop((0 + i*5) / fgStopCount, '#FFDAD2');
			this.fgGradient.addColorStop((1 + i*5) / fgStopCount, '#E8BFBF');
			this.fgGradient.addColorStop((2 + i*5) / fgStopCount, '#FFDEF2');
			this.fgGradient.addColorStop((3 + i*5) / fgStopCount, '#E4C5E8');
			this.fgGradient.addColorStop((4 + i*5) / fgStopCount, '#F0DDFF');
		}
	};

	BubblesAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillStyle = this.bgGradient;
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.drawBubble(this.gallery.width/2, this.gallery.height - t/6, 100);
	};

	BubblesAnimation.prototype.drawBubble = function(x, y, radius) {
		this.gallery.ctx.fillStyle = this.fgGradient;
		this.gallery.ctx.strokeStyle = 'white';
		this.gallery.ctx.lineWidth = 2;

		this.gallery.ctx.beginPath();
		this.gallery.ctx.arc(x, y, radius, 0, 2*Math.PI);
		this.gallery.ctx.closePath();
		this.gallery.ctx.fill();
		this.gallery.ctx.stroke();
	};

	window.AnimationGallery.addAnimation('bubbles', BubblesAnimation);
})(window);
