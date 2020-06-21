(function(window) {

	var ScanlineAnimation = function(gallery) {
		this.gallery = gallery;
		this.color = {
			r: 0,
			g: 0,
			b: 0
		};
		this.y1 = 320;
	};

	ScanlineAnimation.prototype.init = function() {
		this.gallery.canvas.style.background = '#000';

		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
	};

	ScanlineAnimation.prototype.draw = function(t, deltaT)
	{
		this.y1 = (this.y1 + 3) % this.gallery.height;

		this.color.r += Math.floor((Math.random() - 0.5) * 50);
		this.color.g += Math.floor((Math.random() - 0.5) * 50);
		this.color.b += Math.floor((Math.random() - 0.5) * 50);

		var maxBg = 100;
		this.color.r = Math.max(0, this.color.r);
		this.color.g = Math.max(0, this.color.g);
		this.color.b = Math.max(0, this.color.b);
		this.color.r = Math.min(maxBg, this.color.r);
		this.color.g = Math.min(maxBg, this.color.g);
		this.color.b = Math.min(maxBg, this.color.b);

		for(var i = 0; i < 5; i++)
		{
			this.gallery.ctx.beginPath();
			this.gallery.ctx.moveTo(0, (this.y1 * i) % this.gallery.height);
			this.gallery.ctx.lineTo(this.gallery.width, (this.y1 * i) % this.gallery.height);
			this.gallery.ctx.strokeStyle = this.gallery.helpers.rgbStr(this.color.r, this.color.g, this.color.b);
			this.gallery.ctx.stroke();
		}
	};

	window.AnimationGallery.addAnimation('scan', ScanlineAnimation);
	//window.AnimationGallery.startAnimation();
})(window);
