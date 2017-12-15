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
		this.animationRunning = false;

		this.startTime = null;
		this.lastTime = null;

		//init
		this.canvas.width = this.width;
		this.canvas.height = this.height;

		//init mouse/screen/accelerometer
		document.body.onmousemove = function(event) {
			_this.mouseX = event.clientX;
			_this.mouseY = event.clientY;
		};
		document.body.addEventListener('touchmove', function(event) {
			_this.mouseX = event.touches[0].clientX;
			_this.mouseY = event.touches[0].clientY;
		}, false);


		//init links
		var links = document.getElementsByTagName('a');

		for(var i = 0; i < links.length; i++) {
			links[i].addEventListener('mouseenter', function(event) {
				_this.linkHovered = event;
				_this.linkT = 0;
			});
			links[i].addEventListener('mouseleave', function(event) {
				_this.linkHovered = null;
			});
		}
	};

	AnimationGallery.prototype.step = function (timestamp) {
		if(!this.startTime) {
			this.startTime = timestamp;
			this.lastTime = this.startTime;
		}
		var deltaT = timestamp - this.lastTime;
		this.linkT += deltaT;
		this.animations[this.animationIndex].draw((timestamp - this.startTime), deltaT);
		this.lastTime = timestamp;
		var _this = this;
		window.requestAnimationFrame(function() { _this.step.apply(_this, arguments); });
	};

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
		HSVtoRGBStr: HSVtoRGBStr,
		lerpHsv: lerpHsv,
		lerpGradientHsv: lerpGradientHsv,
	};
	function rgbStr(r, g, b) {
		return "rgb("+r+","+g+","+b+")";
	}
	function hsvStr(h, s, v){
		var rgb = HSVtoRGB(h,s,v);
		return "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
	}
	function lerp(a, b, t) {
		return (b-a)*t + a;
	}
	function HSVtoRGB(h, s, v) {
		var r, g, b, i, f, p, q, t;
		if (h && s === undefined && v === undefined) {
			s = h.s; v = h.v; h = h.h;
		}
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
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
	}
	function HSVtoRGBStr(h,s,v) {
		var color = HSVtoRGB(h,s,v);
		return rgbStr(color.r, color.g, color.b);
	}

	// {color, t}
	function lerpGradientHsv(stops, t) {
		if(t > 1) {
			t = 1;
		}
		var s2Index = stops.findIndex(function(s) { return s.t > t; });
		if(s2Index === -1) {
			s2Index = stops.length-1;
		}
		var s1 = stops[s2Index-1];
		var s2 = stops[s2Index];
		var t2 = (t - s1.t)/(s2.t - s1.t);
		return lerpHsv(s1.h, s1.s, s1.v, s2.h, s2.s, s2.v, t2);
	}
	function lerpHsv(h1, s1, v1, h2, s2, v2, t) {
		// Hue interpolation
		var h;
		var t2 = t;
		var d = h2 - h1;
		if (h1 > h2)
		{
			// Swap (h1, h2)
			var h3 = h2;
			h2 = h1;
			h1 = h3;

			d = -d;
			t2 = 1 - t;
		}

		if (d > 0.5) // 180deg
		{
			h1 = h1 + 1; // 360deg
			h = ( h1 + t2 * (h2 - h1) ) % 1; // 360deg
		}
		if (d <= 0.5) // 180deg
		{
			h = h1 + t2 * d;
		}

		// Interpolates the rest
		return {
			h: h,
			s: s1 + t * (s2-s1),
			v: v1 + t * (v2-v1)
		};
	}

	//an animation must be a class constructor which takes this AnimationGallery as a parameter and produces an object with init() and draw(t, deltaT) functions
	AnimationGallery.prototype.addAnimation = function(name, animation) {
		var anim = new animation(this);
		this.animations.push(anim);
	};

	AnimationGallery.prototype.startAnimation = function(index) {
		this.animationIndex = index;
		this.ctx.globalCompositeOperation = 'source-over';
		this.animations[this.animationIndex].init();
		var _this = this;
		if(!this.animationRunning) {
			this.animationRunning = true;
			window.requestAnimationFrame(function() { _this.step.apply(_this, arguments); });
		}
	};

	window.AnimationGallery = new AnimationGallery('backgroundCanvas');

})(window);
