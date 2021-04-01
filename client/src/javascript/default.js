(function(window, document) {
	var AnimationGallery = window.AnimationGallery;

	/*
	var bgCanvas = document.getElementById('backgroundCanvas');
	bgCanvas.width = window.innerWidth;
	bgCanvas.height = window.innerHeight;
	var bgContext = bgCanvas.getContext('2d');

	var fgCanvas = document.getElementById('foregroundCanvas');
	fgCanvas.width = document.body.clientWidth;
	fgCanvas.height = document.body.clientHeight;
	var fgContext = bgCanvas.getContext('2d');
	*/

	//animations
	var Animations = function(animations) {
		var _this = this;
		this.animations = (animations || []).map(function(animation, i) {
			var a = {
				id: i,
				activator: animation.activator,
				onDeactivate: animation.onDeactivate,
				frameLimit: animation.frameLimit,
				draw: animation.draw,
				state: Object.assign({
					start: true
				}, animation.state)
			};
			if(a.activator) {
				a.activator(
					function(data) {_this.activate(a, data);},
					function(data) {_this.deactivate(a, data);});
			}
			return a;
		});
		this.activeAnimations = this.animations.reduce(function(obj, a) {
			if(!a.activator) {
				obj[a.id] = a;
			}
			return obj;
		}, {});

		this.startTime = null;
		this.lastTime = null;

		this.animationPlaying = false;
	};

	Animations.prototype.step = function (timestamp) {
		if(!this.animationPlaying) {
			return;
		}

		if(!this.startTime) {
			this.startTime = timestamp;
			this.lastTime = this.startTime;
		}
		var dt = timestamp - this.lastTime;
		var context = {
			t: (timestamp - this.startTime),
			dt: dt
		};

		var _this = this;
		Object.keys(this.activeAnimations).forEach(function(animId) {

			var anim = _this.activeAnimations[animId];
			if(!anim.frameLimit || anim.state.start || (context.t%(1000/anim.frameLimit)) < context.dt) {
				anim.draw(context, anim.state);
				anim.state.start = false;
			}
		});

		this.lastTime = timestamp;
		window.requestAnimationFrame(function() { _this.step.apply(_this, arguments); });
	};

	Animations.prototype.start = function() {
		if(this.animationPlaying) {
			return;
		}

		var _this = this;
		window.requestAnimationFrame(function() { _this.step.apply(_this, arguments); });
		this.animationPlaying = true;
	};

	Animations.prototype.activate = function(anim, data) {
		anim.state.start = true;
		anim.state.activateData = data;
		this.activeAnimations[anim.id] = anim;
		this.start();
	};

	Animations.prototype.deactivate = function(anim, data) {
		if(anim.onDeactivate) {
			anim.onDeactivate(anim.state, data);
		}
		delete this.activeAnimations[anim.id];
		if(Object.keys(this.activeAnimations).length === 0) {
			this.animationPlaying = false;
		}
	};

	updateTrashLinkLineCharacters();
	updateTrashLinkLineCharacters(); //do it twice
	initializeScrollLinks();

	var animations = new Animations([
		{
			draw: drawRandomCharacters,
			frameLimit: 20,
			state: { elements:
				document.getElementsByClassName('randomCharacters')
			}
		},
		{
			draw: drawScrollLinks,
			frameLimit: 30,
			state: { elements:
				document.getElementsByClassName('scrollLink')
			}
		},
		{
			draw: drawLetterSpacing,
			frameLimit: 30,
			activator: makeAnimationActivator(
				document.getElementsByTagName('a'),
				[{event: 'mouseover', predicate: function(event) {
					return event.target.className !== 'scrollLink' && event.target.id !== 'siteTitle';
				}}],
				[{event: 'mouseout', predicate: function(event) {
					return event.target.className !== 'scrollLink' && event.target.id !== 'siteTitle';
				}}]),
			onDeactivate: function(state, data) {
				data.target.style.letterSpacing = 'normal';
			}
		},
		{
			draw: drawCorruptZone,
			frameLimit: 15,
			activator: makeAnimationActivator(
				document.getElementsByClassName('corruptZone'),
				[{event: 'mouseenter'}],
				[{event: 'mouseleave'}]),
			onDeactivate: function(state, data) {
				for(var i = 0; i < state.children.length; i++)
				{
					state.children[i].innerHTML = state.originalText[i];
				}
			}
		},
		{
			draw: drawH1,
			frameLimit: 8,
		},
		{
			draw: drawTitle,
			frameLimit: 30,
		},
		{
			draw: drawCommentAuthorOwner,
			frameLimit: 10,
		},
	]);

	animations.start();

	window.addEventListener('resize', function() {
		/*
		bgCanvas.width = document.body.clientWidth;
		bgCanvas.height = document.body.clientHeight;
		fgCanvas.width = document.body.clientWidth;
		fgCanvas.height = document.body.clientHeight;
		*/

		//resize trash links
		updateTrashLinkLineCharacters();
		//resize scrollLinks (destructive :) )
		initializeScrollLinks();
	});

	var sourceCodeButton = document.getElementById('source-code-button');
	var sourceCodeElement = document.getElementById('gallery-source-code');
	var showSourceCode = false;

	// fullscreen
	var fullscreenButton = document.getElementById('fullscreen-button');
	var foregroundWrapper = document.getElementById('foregroundWrapper');
	var fullscreen = window.sessionStorage.getItem('fullscreen') === 'true';
	foregroundWrapper.style.visibility = fullscreen ? 'hidden' : 'visible';
	fullscreenButton.addEventListener('click', function() {
		fullscreen = !fullscreen;
		foregroundWrapper.style.visibility = fullscreen ? 'hidden' : 'visible';
		window.sessionStorage.setItem('fullscreen', fullscreen + '');

		if(!fullscreen) {
			showSourceCode = false;
			sourceCodeElement.style.visibility = 'hidden';
		}
	});

	sourceCodeButton.addEventListener('click', function() {
		if(window.AnimationGallery) {
			showSourceCode = !showSourceCode;
			if(showSourceCode) {
				sourceCodeElement.textContent = '';
				fullscreen = true;
				foregroundWrapper.style.visibility = fullscreen ? 'hidden' : 'visible';
				window.sessionStorage.setItem('fullscreen', fullscreen + '');
				const sourceUrl = `${window.location.protocol}//${window.location.host}/javascript/bg-${window.AnimationGallery.animationName}.js`;
				fetch(sourceUrl)
				.then((response) => response.text())
				.then((text) => {
					sourceCodeElement.textContent = text;
				});
			}
			sourceCodeElement.style.visibility = showSourceCode ? 'visible' : 'hidden';
		}
	});


	// gallery controls
	var animationNameDisplay = document.getElementById('animation-name');
	var prevAnimationButton = document.getElementById('prev-animation-button');
	var nextAnimationButton = document.getElementById('next-animation-button');
	prevAnimationButton.addEventListener('click', function() {
		if(window.AnimationGallery) {
			showSourceCode = false;
			sourceCodeElement.style.visibility = 'hidden';

			window.AnimationGallery.startAnimation((window.AnimationGallery.animationIndex + window.AnimationGallery.animations.length - 1) % window.AnimationGallery.animations.length);
			animationNameDisplay.textContent = window.AnimationGallery.animationName;
			window.sessionStorage.setItem('background', '' + window.AnimationGallery.animationName);
		}
	});
	nextAnimationButton.addEventListener('click', function() {
		if(window.AnimationGallery) {
			showSourceCode = false;
			sourceCodeElement.style.visibility = 'hidden';

			window.AnimationGallery.startAnimation((window.AnimationGallery.animationIndex + 1) % window.AnimationGallery.animations.length);
			animationNameDisplay.textContent = window.AnimationGallery.animationName;
			window.sessionStorage.setItem('background', '' + window.AnimationGallery.animationName);
		}
	});

	var linkCopyButton = document.getElementById('link-copy-button');
	var linkCopiedText = document.getElementById('link-copied-text');
	var linkCopiedUrl = document.getElementById('link-copied-url');

	linkCopyButton.addEventListener('click', function() {
		if(window.AnimationGallery) {
			const queryParams = new URLSearchParams({
				'background': window.AnimationGallery.animationName,
				'fullscreen': true,
			});

			const pageUrl = `${window.location.protocol}//${window.location.host}?${queryParams}`;
			linkCopiedUrl.textContent = pageUrl;
			linkCopiedUrl.classList.add('visible');
			linkCopiedText.classList.add('visible');
			navigator.clipboard.writeText(pageUrl);

			window.setTimeout(function() {
				linkCopiedUrl.classList.remove('visible');
				linkCopiedText.classList.remove('visible');
			}, 1000);
		}
	});

	function drawRandomCharacters(context, state) {
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*_=+,./~`";
		for(var eIt = 0; eIt < state.elements.length; eIt++)
		{
			var text = state.elements[eIt].textContent;
			var newText = "";
			for( var i = 0, len = text.length; i < len; i++)
			{
				newText += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			state.elements[eIt].textContent = newText;
		}
	}

	function drawLetterSpacing(context, state) {
		if(state.start) {
			state.letterSpacing = 3;
		}

		state.activateData.target.style.letterSpacing = state.letterSpacing + "px";
		state.letterSpacing += 2;
	}

	function drawCorruptZone(context, state) {
		if(state.start) {
			state.element = state.activateData.target;
			state.originalText = [];
			state.children = state.element.children;
			for(var i = 0; i < state.children.length; i++)
			{
				state.originalText.push(state.children[i].innerHTML);
			}
			state.text = state.originalText.slice(0);
		}

		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*_=+,./~`";
		var randomChild = Math.floor(Math.random() * state.children.length);
		var newString = "";
		var randomCharIndex = Math.floor(state.text[randomChild].length * Math.random());
		for(var i = 0; i < state.text[randomChild].length; i++)
		{
			if(i != randomCharIndex) {
				newString += state.text[randomChild].charAt(i);
			}
			else {
				newString += possible.charAt(Math.floor(Math.random() * possible.length));
			}
		}
		state.text[randomChild] = newString;
		state.children[randomChild].innerHTML = newString;
	}

	function drawH1(context, state) {
		if(state.start) {
			state.hue = 0.0;
			state.elements = document.getElementsByTagName('h1');
		}

		var color = AnimationGallery.helpers.HSVtoRGB(state.hue, 0.1, 1.0);
		color.r = 255 - color.r;
		color.g = 255 - color.g;
		color.b = 255 - color.b;

		for(var i = 0; i < state.elements.length; i++)
		{
			state.elements[i].style.color = AnimationGallery.helpers.rgbStr(color.r, color.g, color.b);
			if(state.elements[i].id != "backButton")
				state.elements[i].style.backgroundColor = AnimationGallery.helpers.rgbStr(255 - color.r, 255 - color.g, 255 - color.b);
		}
		state.hue = (state.hue + 0.55)%1;
	}

	function drawTitle(context, state) {
		if(state.start) {
			state.element = document.getElementById('siteTitle');
			state.titleColor = {
				r: 0,
				g: 0,
				b: 0
			};
			state.bgColor = {
				r: 0,
				g: 0,
				b: 0
			};
		}

		state.bgColor.r = Math.max(50, Math.min(150, state.bgColor.r + Math.floor((Math.random() - 0.5) * 50)));
		state.bgColor.g = Math.max(50, Math.min(150, state.bgColor.g + Math.floor((Math.random() - 0.5) * 50)));
		state.bgColor.b = Math.max(50, Math.min(150, state.bgColor.b + Math.floor((Math.random() - 0.5) * 50)));

		var colorRange = 10;
		var calcColorComp = function(c) {
			return Math.floor(255 - c + ((Math.random() - 0.5) * colorRange));
		};

		state.titleColor.r = calcColorComp(colorRange / 2);
		state.titleColor.g = calcColorComp(colorRange / 2);
		state.titleColor.b = calcColorComp(colorRange / 2);

		state.element.style.color = AnimationGallery.helpers.rgbStr(state.titleColor.r, state.titleColor.g, state.titleColor.b);

		var bgColors = [
			[state.bgColor.r, state.bgColor.g, state.bgColor.b],
			[state.bgColor.g, state.bgColor.b, state.bgColor.r],
			[state.bgColor.b, state.bgColor.r, state.bgColor.g],
			[state.bgColor.r, state.bgColor.b, state.bgColor.g],
		].map(function(c) {
			return AnimationGallery.helpers.rgbStr(
				calcColorComp(c[0]),
				calcColorComp(c[1]),
				calcColorComp(c[2]));
		});

		state.element.style.textShadow = " -15px 0 "+bgColors[0]+", 0 15px "+bgColors[1]+", 15px 0 "+bgColors[2]+", 0 -15px "+bgColors[3];
	}

	function drawCommentAuthorOwner(context, state) {
		if(state.start) {
			state.elements = document.getElementsByClassName('commentAuthorOwner');
			state.hue = 0.0;
			state.hueStep = 0.05;
			for(var i = 0; i < state.elements.length; i++)
			{
				var message = state.elements[i].innerHTML;
				var newMessage = "";
				for (var j = 0; j < message.length; j++)
				{
					var color = AnimationGallery.helpers.hsvStr(state.hue, 1.0, 1.0);
					newMessage += "<span style=\"color:" + color + ";\">" + message[j] + "</span>";
					state.hue = (state.hue + state.hueStep)%1;
				}
				state.elements[i].innerHTML = newMessage;
			}
		}

		for(var i = 0; i < state.elements.length; i++)
		{
			var children = state.elements[i].children;
			for(var j = 0; j < children.length - 1; j++)
			{
				children[j].style.color = children[j+1].style.color;
			}
			var color = AnimationGallery.helpers.hsvStr(state.hue, 1.0, 1.0);
			children[children.length - 1].style.color = color;
			state.hue = (state.hue + state.hueStep)%1;
		}
	}

	function makeAnimationActivator(elements, activateOptions, deactivateOptions) {
		return function(activate, deactivate) {
			for(var i = 0; i < elements.length; i++) {
				activateOptions.forEach(function(opts) {
					elements[i].addEventListener(opts.event, function(event) {
						if(!opts.predicate || opts.predicate(event)) {
							activate(event);
						}
					});
				});
				deactivateOptions.forEach(function(opts) {
					elements[i].addEventListener(opts.event, function(event) {
						if(!opts.predicate || opts.predicate(event)) {
							deactivate(event);
						}
					});
				});
			}
		};
	}

	function updateTrashLinkLineCharacters()
	{
		var letterWidth = document.getElementById("letterSize").clientWidth + 1;
		var elements = document.getElementsByClassName("trashLink");
		for(var i = 0; i < elements.length; i++)
		{
			var nodes = elements[i].childNodes;
			var parent = elements[i].parentNode;
			var parentWidth = parent.clientWidth;
			//var linkPosition = nodes[0].offsetWidth;
			var linkPositionPercent = elements[i].getAttribute("data-link-horiz");
			var linkTargetPosition = linkPositionPercent * parentWidth;
			var leftDeltaCharacters = (linkTargetPosition - nodes[0].offsetWidth) / letterWidth;
			var k = 0;
			if(leftDeltaCharacters < 0)
			{
				nodes[0].textContent = nodes[0].textContent.substring(0, nodes[0].textContent.length + leftDeltaCharacters);
			}
			else
			{
				for(k = 0; k < leftDeltaCharacters; k++)
				{
					nodes[0].textContent += "a";
				}
			}

			var linkWidth = nodes[1].offsetWidth;
			var rightDeltaCharacters = ((parentWidth - (linkTargetPosition + linkWidth)) - nodes[2].offsetWidth) / letterWidth;
			if(rightDeltaCharacters < 0)
			{
				nodes[2].textContent = nodes[2].textContent.substring(0, nodes[2].textContent.length + rightDeltaCharacters);
			}
			else
			{
				for(k = 0; k < rightDeltaCharacters + 10; k++)
				{
					nodes[2].textContent += "a";
				}
			}
		}
	}

	var scrollLinkMaxDelay = 60;
	function initializeScrollLinks() {
		var elements = document.getElementsByClassName('scrollLink');
		var delimiter = "_";
		var delimiterCount = 20;
		var letterWidth = document.getElementById('letterSize').clientWidth + 1;
		for(var i = 0; i < elements.length; i++)
		{
			elements[i].setAttribute("data-linkdelay", Math.floor(Math.random() * scrollLinkMaxDelay));
			var parent = elements[i].parentNode;
			var parentWidth = parent.clientWidth;
			var linkWidth = elements[i].offsetWidth;
			var rightDeltaCharacters = (parentWidth - linkWidth) / letterWidth;
			var textContent = elements[i].textContent;
			if(rightDeltaCharacters < 0)
			{
				elements[i].textContent = elements[i].textContent.substring(0, elements[i].textContent.length + rightDeltaCharacters);
			}
			else
			{
				rightDeltaCharacters += 10;
				rightDeltaCharacters += (textContent.length + delimiterCount) - (rightDeltaCharacters % (textContent.length + delimiterCount));
				for(var k = textContent.length; k < rightDeltaCharacters; k++)
				{
					if(k % (textContent.length + delimiterCount) >= textContent.length)
					{
						elements[i].textContent += delimiter;
					}
					else
					{
						elements[i].textContent += textContent[k % (textContent.length + delimiterCount)];
					}
				}
			}
		}
	}

	function drawScrollLinks(context, state) {
		var offsetAmount = 1;
		for(var i = 0; i < state.elements.length; i++)
		{
			if(AnimationGallery.linkHovered && AnimationGallery.linkHovered.target === state.elements[i]) {
				continue;
			}

			var scrollDelay = state.elements[i].getAttribute("data-linkdelay");
			if(scrollDelay > 0) {
				state.elements[i].setAttribute("data-linkdelay", scrollDelay - 1);
				continue;
			}
			else if(Math.random() < 0.1) {
				state.elements[i].setAttribute("data-linkdelay", scrollLinkMaxDelay);
			}

			var textContent = state.elements[i].textContent;
			var newContent = "";
			var offset = offsetAmount;
			//if(Math.random() < 0.2)
			//	offset = textContent.length - offsetAmount;
			for(var j = offset; j < textContent.length + offset; j++)
			{
				newContent += state.elements[i].textContent[j % textContent.length];
			}
			state.elements[i].textContent = newContent;
		}
	}
})(window, document);
