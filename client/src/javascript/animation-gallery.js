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
		this.animationName = '';
		this.animationRunning = false;
		this.animationMap = {};

		this.startTime = null;
		this.lastTime = null;
		this.pauseTime = null;

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

	AnimationGallery.prototype.resize = function(width, height) {
		const prevFrame = this.ctx.getImageData(0, 0, this.width, this.height);
		this.width = width;
		this.height = height;

		this.canvas.width = width;
		this.canvas.height = height;

		this.ctx.putImageData(prevFrame, 0, 0);
	}

	AnimationGallery.prototype.step = function (timestamp) {
		if(!this.startTime) {
			this.startTime = timestamp;
			this.lastTime = this.startTime;
		}
		var deltaT = timestamp - this.lastTime;
		this.linkT += deltaT;
		this.animations[this.animationIndex].anim.draw((timestamp - this.startTime), deltaT);
		this.lastTime = timestamp;
		var _this = this;

		if(this.animationRunning) {
			window.requestAnimationFrame(function() { _this.step.apply(_this, arguments); });
		}
	};

	//a bg can specify:
	//init function()
	//draw function(t, deltaT)
	//each is passed a context containing width, height, mouseX/Y, linkHovered
	//has access to helper functions
	//can set aspect ratio, width+height

	AnimationGallery.prototype.helpers = {
		rgbStr: rgbStr,
		rgbaStr: rgbaStr,
		hsvStr: hsvStr,
		lerp: lerp,
		HSVtoRGB: HSVtoRGB,
		HSVtoRGBStr: HSVtoRGBStr,
		HSVAtoRGBAStr: HSVAtoRGBAStr,
		lerpHsv: lerpHsv,
		lerpGradientHsv: lerpGradientHsv,
	};
	function rgbStr(r, g, b) {
		return "rgb("+r+","+g+","+b+")";
	}
	function rgbaStr(r, g, b, a) {
		return "rgb("+r+","+g+","+b+","+a+")";
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

	function HSVAtoRGBAStr(h,s,v,a) {
		var color = HSVtoRGB(h,s,v);
		return rgbaStr(color.r, color.g, color.b, a);
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
		this.animations.push({name: name, anim});
		this.animationMap[name] = anim;
	};

	AnimationGallery.prototype.startAnimation = function(idx) {
		let index = idx;
		if(typeof index === 'string') {
			index = this.animations.findIndex(({name, anim}) => name === index);
		}

		if(index == null || index < 0 || index >= this.animations.length) {
			throw new Error(`animation '${idx}' does not exist`);
		}

		this.animationIndex = index;
		this.animationName = this.animations[index].name;
		this.ctx.globalCompositeOperation = 'source-over';
		this.canvas.style.background = '#ffffff';
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.animations[this.animationIndex].anim.init();
		this.startTime = null;
		var _this = this;
		if(!this.animationRunning) {
			this.animationRunning = true;
			window.requestAnimationFrame(function() { _this.step.apply(_this, arguments); });
		}
	};

	AnimationGallery.prototype.pauseAnimation = function() {
		this.animationRunning = false;
		this.pauseTime = this.lastTime;
	}

	/** tries to resume the last animation if it was paused. */
	AnimationGallery.prototype.resumeAnimation = function() {
		if(this.animationRunning === false
		&& this.animationIndex >= 0
		&& this.animationIndex < this.animations.length ) {
			this.animationRunning = true;
			var _this = this;
			window.requestAnimationFrame(function() {
				var pausedDuration = arguments[0] - _this.pauseTime;
				_this.lastTime += pausedDuration;
				_this.startTime += pausedDuration;
				_this.step.apply(_this, arguments);
			});
		}
	};

	AnimationGallery.prototype.displayAnimationStill = function(idx, timestamp) {
		this.mouseX = Math.random()*this.width;
		this.mouseY = Math.random()*this.height;

		// kind of hacky but...
		// pretend an animation is already running, so startAnimation doesn't call step
		this.animationRunning = true;
		this.startAnimation(idx);
		this.animationRunning = false;
		// then manually draw a frame
		if(timestamp == undefined) {
			timestamp = Math.random() * 1000*20;
		}

		this.animations[this.animationIndex].anim.draw((timestamp), 2000);
		this.lastTime = timestamp;
		this.pauseAnimation();
	};

	window.AnimationGallery = new AnimationGallery('backgroundCanvas');

})(window);
