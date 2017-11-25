(function(window) {

	/**
	 * bodies in a gravity simulation
	 */
	var TargetingAnimation = function(gallery) {
		this.gallery = gallery;
	};

	TargetingAnimation.prototype.init = function() {
		this.gallery.ctx.fillStyle = '#000';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		this.target = {
			corners: [
				{
					p1: {x: 10, y:10},
					p2: {x: 10, y:10}
				},
				{
					p1: {x: this.gallery.width - 10, y:10},
					p2: {x: this.gallery.width - 10, y:10}
				},
				{
					p1: {x: 10, y:this.gallery.height - 10},
					p2: {x: 10, y:this.gallery.height - 10}
				},
				{
					p1: {x: this.gallery.width - 10, y:this.gallery.height - 10},
					p2: {x: this.gallery.width - 10, y:this.gallery.height - 10}
				}],
			t: 0,
			width: this.gallery.width - 10,
			height: this.gallery.height - 10,
			color: '#fff',
			speed: 1,
		};

		//var aspectRatio = this.gallery.width / this.gallery.height;
		this.linkHoveredLast = null;
	};

	TargetingAnimation.prototype.draw = function(t, deltaT)
	{
		this.gallery.ctx.fillStyle = 'rgb(112, 134, 168)';
		this.gallery.ctx.fillRect(0,0,this.gallery.width,this.gallery.height);

		if(this.gallery.linkHovered && !this.linkHoveredLast) {
			var rect = this.gallery.linkHovered.target.getBoundingClientRect();
			this.setTarget(
				this.target,
				rect.left + rect.width/2,
				rect.top + rect.height/2,
				rect.width + 20,
				rect.height + 20);
		}

		this.drawTarget(this.target, t, deltaT);
		this.target.t = Math.min(1, this.target.t + this.target.speed*deltaT/1000); 

		this.linkHoveredLast = this.gallery.linkHovered;
	};

	// get xy position of corner. c specifies corner in order topleft, topright, bottomleft, bottomright
	function calcCornerPosition(x, y, width, height, c) {
		switch(c) {
		case 0:
			return {
				x: x - width/2,
				y: y - height/2,
			};
		case 1:
			return {
				x: x + width/2,
				y: y - height/2,
			};
		case 2:
			return {
				x: x - width/2,
				y: y + height/2,
			};
		case 3:
			return {
				x: x + width/2,
				y: y + height/2,
			};
		}
	}
	TargetingAnimation.prototype.setTarget = function(target, x, y, width, height) {
		var _this = this;
		target.corners = target.corners.map(function(corner, i) {
			return {
				p1: {
					x: _this.gallery.helpers.lerp(corner.p1.x, corner.p2.x, easeOutQuint(target.t)),
					y: _this.gallery.helpers.lerp(corner.p1.y, corner.p2.y, easeOutQuint(target.t))
				},
				p2: calcCornerPosition(x, y, width, height, i)
			};
		});

		target.width = width;
		target.height = height;

		target.t = 0;
	};

	TargetingAnimation.prototype.drawTarget = function(target, t, deltaT) {
		var _this = this;
		this.gallery.ctx.strokeStyle = target.color;

		target.corners.forEach(function(corner, i) {
			var x = _this.gallery.helpers.lerp(corner.p1.x, corner.p2.x, easeOutQuint(target.t));
			var y = _this.gallery.helpers.lerp(corner.p1.y, corner.p2.y, easeOutQuint(target.t));
			drawCorner(_this.gallery.ctx, x, y, i, Math.min(target.width, target.height) * 0.2);

			// corner line
			var cornerX = 0;
			var cornerY = 0;
			if(i % 2 === 1) {
				cornerX = _this.gallery.width;
			}
			if(i >= 2) {
				cornerY = _this.gallery.height;
			}

			_this.gallery.ctx.beginPath();
			_this.gallery.ctx.moveTo(cornerX, cornerY);
			_this.gallery.ctx.lineTo(x, y);
			_this.gallery.ctx.stroke();
		});
	};

	function drawCorner(ctx, x, y, c, edgeLength)  {
		var y1;
		var x2;
		if(c < 2) {
			y1 = y + edgeLength;
		}
		else {
			y1 = y - edgeLength;
		}
		if(c % 2 === 0) {
			x2 = x + edgeLength;
		}
		else {
			x2 = x - edgeLength;
		}

		ctx.beginPath();
		ctx.moveTo(x, y1);
		ctx.lineTo(x, y);
		ctx.lineTo(x2, y);
		ctx.stroke();
	}

	function easeOutQuint(t) {
		return 1+(--t)*t*t*t*t;
	}

	window.AnimationGallery.addAnimation('targeting', TargetingAnimation);
})(window);
