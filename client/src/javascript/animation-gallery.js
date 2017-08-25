(function(window) {
	var AnimationGallery = function(canvasId) {
		var _this = this;
		//public
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.canvas = document.getElementById(canvasId);
		this.ctx = this.canvas.getContext("2d");
		this.mouseX = this.width/2;
		this.mouseY = this.height/2;
		this.linkHovered = null;
		this.linkT = 0;

		//private
		this.animations = [];
		this.animationIndex = 0;

		this.startTime = null;
		this.lastTime = null;

		//init
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		//init mouse/screen/accelerometer
		document.body.onmousemove = function(event) {
			_this.mouseX = event.clientX;
			_this.mouseY = event.clientY;
		}
		document.body.addEventListener('touchmove', function(event) {
			_this.mouseX = event.touches[0].clientX;
			_this.mouseY = event.touches[0].clientY;
		}, false);


		//init links
		var links = document.getElementsByTagName('a');

		for(var i = 0; i < links.length; i++) {
			links[i].addEventListener('mouseenter', function(event) {
				_this.linkHovered = this;
				_this.linkT = 0;
			});
			links[i].addEventListener('mouseleave', function(event) {
				_this.linkHovered = null;
			});
		}
	}

	AnimationGallery.prototype.step = function (timestamp) {
		if(!this.startTime) {
			this.startTime = timestamp;
			this.lastTime = this.startTime;
		}
		this.animations[this.animationIndex].draw((timestamp - this.startTime), timestamp - this.lastTime);
		this.lastTime = timestamp;
		var _this = this;
		window.requestAnimationFrame(function() { _this.step.apply(_this, arguments); });
	}

	//a bg can specify:
	//init function()
	//draw function(t, deltaT)
	//each is passed a context containing width, height, mouseX/Y, linkHovered
	//has access to helper functions
	//can set aspect ratio, width+height

	AnimationGallery.prototype.helpers = {
		rgbStr: rgbStr,
		hsvStr: hsvStr,
		lerp: lerp,
		HSVtoRGB: HSVtoRGB,
		HSVtoRGBStr: HSVtoRGBStr
	};
	function rgbStr(r, g, b) {
		return "rgb("+r+","+g+","+b+")";
	};
	function hsvStr(h, s, v){
		return "hsv("+h+","+s+","+v+")";
	};
	function lerp(a, b, t) {
		return (b-a)*t + a;
	};
	function HSVtoRGB(h, s, v) {
		var r, g, b, i, f, p, q, t;
		if (h && s === undefined && v === undefined) {
			s = h.s; v = h.v; h = h.h;
		}
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);https://www.dropbox.com/s/16q6nxob8e1cfbb/eye2.html?dl=0
		switch (i % 6) {
			case 0: r = v; g = t; b = p; break;
			case 1: r = q; g = v; b = p; break;
			case 2: r = p; g = v; b = t; break;
			case 3: r = p; g = q; b = v; break;
			case 4: r = t; g = p; b = v; break;
			case 5: r = v; g = p; b = q; break;
		}
		return {
			r: Math.floor(r * 255),
			g: Math.floor(g * 255),
			b: Math.floor(b * 255)
		};
	};
	function HSVtoRGBStr(h,s,v) {
		var color = HSVtoRGB(h,s,v);
		return rgbStr(color.r, color.g, color.b);
	}

	//an animation must be a class constructor which takes this AnimationGallery as a parameter and produces an object with init() and draw(t, deltaT) functions
	AnimationGallery.prototype.addAnimation = function(name, animation) {
		var anim = new animation(this);
		this.animations.push(anim);
	}

	AnimationGallery.prototype.startAnimation = function(index) {
		this.animationIndex = index;
		this.animations[this.animationIndex].init();
		var _this = this;
		window.requestAnimationFrame(function() { _this.step.apply(_this, arguments); });
	}

	window.AnimationGallery = new AnimationGallery('backgroundCanvas');

})(window);
