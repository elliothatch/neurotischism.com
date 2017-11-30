(function(window) {

	/**
	 * bodies in a gravity simulation
	 */
	var LightAnimation = function(gallery) {
		this.gallery = gallery;
	};

	LightAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.lights = [{
			pos: {
				x: this.gallery.width / 2,
				y: this.gallery.height / 2
			},
			skew: {
				x: 0,
				y: 0
			},
			color: this.gallery.helpers.rgbStr(255, 0, 0),
			radius: 100,
			t: 0,
		}, {	
			pos: {
				x: this.gallery.width / 2 + 100,
				y: this.gallery.height / 2
			},
			skew: {
				x: 0,
				y: 0
			},
			color: this.gallery.helpers.rgbStr(0, 255, 0),
			radius: 100,
			t: 0,
		}, {	
			pos: {
				x: this.gallery.width / 2 + 100/2,
				y: this.gallery.height / 2 - Math.sqrt(3)/2*100
			},
			skew: {
				x: 0,
				y: 0
			},
			color: this.gallery.helpers.rgbStr(0, 0, 255),
			radius: 100,
			t: 0,
		}];

		//var aspectRatio = this.gallery.width / this.gallery.height;

	};

	LightAnimation.prototype.draw = function(t, deltaT)
	{
		//this.gallery.ctx.clearRect(0, 0, this.gallery.width, this.gallery.height);
		this.gallery.ctx.globalCompositeOperation = 'source-over';
		//this.gallery.ctx.fillStyle = 'rgba(0,0,0,0,.01)';
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);
		
		this.lights[0].pos.x = this.gallery.mouseX;
		this.lights[0].pos.y = this.gallery.mouseY;
		
		if(t - deltaT < Math.floor(t/1000)*1000) {
			this.lights.push({
				pos: {
					x: Math.random()*this.gallery.width,
					y: Math.random()*this.gallery.height
				},
				skew: {
					x: 0,
					y: 0
				},
				color: this.gallery.helpers.hsvStr(Math.random(), 255, 255), //TODO: fix
				radius: this.gallery.helpers.lerp(50, 200, Math.random()),
				t: 0,
			});
			this.madeNewLight = true;
		}
		
		this.gallery.ctx.globalCompositeOperation = 'lighter';

		var _this = this;
		this.lights.forEach(function(l) {
			_this.drawLight(l, deltaT);
		});
	};

	LightAnimation.prototype.drawLight = function(light, deltaT) {
		var gradient = 
			this.gallery.ctx.createRadialGradient(
				light.pos.x,
				light.pos.y,
				light.radius,
				light.pos.x + light.skew.x, // outer circle
				light.pos.y + light.skew.y, //TODO: add skew
				//light.pos.y*1.5, //TODO: add skew
				//0)
				this.gallery.helpers.lerp(0, light.radius-1, -Math.exp(-5*light.t)+1));
		gradient.addColorStop(0, this.gallery.helpers.rgbStr(0,0,0));
		gradient.addColorStop(1, light.color);
		this.gallery.ctx.fillStyle = gradient;
		this.gallery.ctx.fillRect(0, 0, this.gallery.width, this.gallery.height);
		//light.pos.x - light.radius,
		//light.pos.y - light.radius,
		//light.pos.x + light.radius/2,
		//light.pos.y + light.radius/2);
		//
		light.t = Math.min(1, light.t + 3*deltaT/1000);
	};

	window.AnimationGallery.addAnimation('light', LightAnimation);
})(window);
