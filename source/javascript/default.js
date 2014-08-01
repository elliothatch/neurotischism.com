var canvas1 = document.getElementById("background_canvas");
	var mainContext = canvas1.getContext("2d");
	var mainWidth = document.body.clientWidth;
	var mainHeight = document.body.clientHeight;
	canvas1.width = mainWidth;
	canvas1.height = mainHeight;

var canvas2 = document.getElementById("foreground_canvas");
	var foregroundContext = canvas2.getContext("2d");
	var mainWidth = document.body.clientWidth;
	var mainHeight = document.body.clientHeight;
	canvas2.width = mainWidth;
	canvas2.height = mainHeight;

	var y1 = 320;
	var lineR = 0;
	var lineG = 0;
	var lineB = 0;


	var titleDiv = document.getElementById("site-title");
	var titleR = 0;
	var titleG = 0;
	var titleB = 0;

	var linkLetterSpacing = 1;
	var isLinkHovered = false;
	var hoveredLink;

	var isH1Hovered = false;
	var hoveredH1;
	var hoveredH1Rect;

	var h1Hue = 0;

	var scrollMaxDelay = 30 * 2;

	mainContext.fillStyle="#000000";
	mainContext.fillRect(0,0,mainWidth,mainHeight);
	window.setInterval(function(){y1 += 2; y1 = y1 % mainHeight; animateGeo();},1000/60);
	window.setInterval(function(){changeTitleColor();},1000/30);
	window.setInterval(function(){updateLinkLetterSpacing();},1000/30);
	window.setInterval(function(){updateRandomCharacters();}, 1000/30);
	window.setInterval(function(){updateScrollLinks();}, 1000/40);
	window.setInterval(function(){updateH1Colors();}, 1000/10);
	window.setInterval(function(){updateH1HoverColoring();}, 1000/30);

	//add the mouse events to all links
	var linkElements = document.getElementsByTagName('a');
	for(var i = 0; i < linkElements.length; i++) {
	    linkElements[i].onmouseover = function() {startLinkLetterSpacing(this);};
	    linkElements[i].onmouseout = function() {stopLinkLetterSpacing();};
	}
	//add the mouse events to all h1s
	var h1Elements = document.getElementsByTagName('h1');
	for(var i = 0; i < h1Elements.length; i++)
	{
		if(h1Elements[i].id == "backButton")
			continue;
		h1Elements[i].onmouseover = function() {startH1Coloring(this);};
	    h1Elements[i].onmouseout = function() {stopH1Coloring();};
	}

	updateTrashLinkLineCharacters();
	initializeScrollLinks();
	formInit();

	function formInit()
	{
		var forms = document.getElementsByTagName("form");
		for(var i = 0; i < forms.length; i++)
		{
			forms[i].onsubmit = onFormSubmit;
		}
	}

	function onFormSubmit(event)
	{
		event.target.submitButton.disabled = true;
	}


	function startH1Coloring(obj)
	{
		hoveredH1 = obj;
		isH1Hovered = true;
		hoveredH1Rect = hoveredH1.getBoundingClientRect();
	}

	function stopH1Coloring()
	{
		//hoveredH1 = null;
		isH1Hovered = false;
		//reset canvas
		canvas2.width = canvas2.width;
	}

	function updateH1HoverColoring()
	{
		if(isH1Hovered)
		{
			for(var i = 0; i< 20; i++)
			{
				var xPos = Math.floor(hoveredH1Rect.width * Math.random()) + hoveredH1Rect.left;
				foregroundContext.beginPath();
				foregroundContext.moveTo(xPos, hoveredH1Rect.top + window.pageYOffset);
				foregroundContext.lineTo(xPos, hoveredH1Rect.bottom + window.pageYOffset);
				foregroundContext.strokeStyle=rgbToHex(lineR, lineG, lineB);
				foregroundContext.lineWidth = Math.random() * 20;
				foregroundContext.stroke();
			}
		}
	}

	function updateH1Colors()
	{
		var elements = document.getElementsByTagName('h1');

		var rgbColor = HSVtoRGB(h1Hue, 1.0, 1.0);

		for(var i = 0; i < elements.length; i++)
		{
			elements[i].style.color = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
			if(elements[i].id != "backButton")
				elements[i].style.backgroundColor = rgbToHex(255 - rgbColor.r, 255 - rgbColor.g, 255 - rgbColor.b);
		}
		h1Hue += 0.55;
		if(h1Hue > 1.0)
			h1Hue -= 1.0;
	}


	function initializeScrollLinks()
	{
		var delimiter = "_";
		var delimiterCount = 20;
		var letterWidth = document.getElementById("letterSize").clientWidth + 1;
		var elements = document.getElementsByClassName("scrollLink");
		for(var i = 0; i < elements.length; i++)
		{
			elements[i].setAttribute("data-linkdelay", Math.floor(Math.random() *scrollMaxDelay));
			var parent = elements[i].parentNode;
			var parentWidth = parent.clientWidth;
			var linkWidth = elements[i].offsetWidth;
			var rightDeltaCharacters = (parentWidth - linkWidth) / letterWidth;
			var textContent = elements[i].textContent;
			if(rightDeltaCharacters < 0)
			{
				elements[i].textContent = elements[i].textContent.substring(0, elements[i].textContent.length + rightDeltaCharacters)
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

	function updateScrollLinks()
	{
		var offsetAmount = 1;
		var elements = document.getElementsByClassName("scrollLink");
		for(var i = 0; i < elements.length; i++)
		{
			if(isLinkHovered && hoveredLink == elements[i])
				continue;

			var scrollDelay = elements[i].getAttribute("data-linkdelay")
			if(scrollDelay > 0)
			{
				elements[i].setAttribute("data-linkdelay", scrollDelay - 1);
				continue;
			}
			else if(Math.random() < 0.1)
				elements[i].setAttribute("data-linkdelay", scrollMaxDelay);
			var textContent = elements[i].textContent;
			var newContent = "";
			var offset = offsetAmount;
			//if(Math.random() < 0.2)
			//	offset = textContent.length - offsetAmount;
			for(var j = offset; j < textContent.length + offset; j++)
			{
				newContent += elements[i].textContent[j % textContent.length];
			}
			elements[i].textContent = newContent;
		}
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
			var linkPosition = nodes[0].offsetWidth;
			var linkPositionPercent = elements[i].getAttribute("data-link-horiz");
			var linkTargetPosition = linkPositionPercent * parentWidth;
			var leftDeltaCharacters = (linkTargetPosition - nodes[0].offsetWidth) / letterWidth;
			if(leftDeltaCharacters < 0)
			{
				nodes[0].textContent = nodes[0].textContent.substring(0, nodes[0].textContent.length + leftDeltaCharacters)
			}
			else
			{
				for(var k = 0; k < leftDeltaCharacters; k++)
				{
					nodes[0].textContent += "a";
				}
			}

			var linkWidth = nodes[1].offsetWidth;
			var rightDeltaCharacters = ((parentWidth - (linkTargetPosition + linkWidth)) - nodes[2].offsetWidth) / letterWidth;
			//console.log(rightDeltaCharacters);
			if(rightDeltaCharacters < 0)
			{
				nodes[2].textContent = nodes[2].textContent.substring(0, nodes[2].textContent.length + rightDeltaCharacters)
			}
			else
			{
				for(var k = 0; k < rightDeltaCharacters + 10; k++)
				{
					nodes[2].textContent += "a";
				}
			}
		}
	}

	function updateRandomCharacters()
	{
		var elements = document.getElementsByClassName("randomCharacters");
    	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*_=+,./~`";
		for(var eIt = 0; eIt < elements.length; eIt++)
		{
			var text = elements[eIt].textContent;
			var newText = "";
			for( var i = 0, len = text.length; i < len; i++)
			{
				newText += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			elements[eIt].textContent = newText;
		}
	}

	function updateRandomBodyCharacters()
	{

		var bodyParagraph = document.getElementById("bodyParagraph");
		var text = bodyParagraph.innerHTML;
		var newText = "";
    	  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*_=+,./~`";

    	//var i = text.length;
    	var inLink = false;
    	var wasLessThan = false;
    	var wasSlash = false;
    	for( var i = 0, len = text.length; i < len; i++)
    	{
    		var character = text[i];
    		if(inLink)
    		{
    			if(wasLessThan == false)
    			{
	    			if(character == "<")
	    			{
	    				wasLessThan = true;
	    				newText += character;
	    				continue;
	    			}
    			}
    			if(wasLessThan)
    			{
    				if(character == "/")
    				{
    					wasSlash = true;
    					newText += character;
    					continue;
    				}
    			}
    			if(wasSlash)
    			{
    				if(character == ">")
    				{
    					inLink = false;
    					wasLessThan = false;
    					wasSlash = false;
    				}
    			}
    			newText += character;
    			continue;
    		}
    		else
    		{
	    		if(character == "<")
	    		{
	    			inLink = true;
	    			newText += character;
	    			continue;
	    		}
    			newText += possible.charAt(Math.floor(Math.random() * possible.length));
    		}
    	}

    	bodyParagraph.innerHTML = newText;
	}

	function startLinkLetterSpacing(obj)
	{
		isLinkHovered = true;
		hoveredLink = obj;
	}

	function stopLinkLetterSpacing()
	{
		isLinkHovered = false;
		hoveredLink.style.letterSpacing = "normal";
		linkLetterSpacing = 1;
	}

	function updateLinkLetterSpacing()
	{
		if(isLinkHovered && hoveredLink.className != "scrollLink")
		{
			linkLetterSpacing += 2;
			hoveredLink.style.letterSpacing = linkLetterSpacing + "px";
		}
	}

	function animateGeo()
	{

			lineR += Math.floor((Math.random() - 0.5) * 50);
			lineG += Math.floor((Math.random() - 0.5) * 50);
			lineB += Math.floor((Math.random() - 0.5) * 50);

			lineR = Math.max(0, lineR);
			lineG = Math.max(0, lineG);
			lineB = Math.max(0, lineB);
			lineR = Math.min(255, lineR);
			lineG = Math.min(255, lineG);
			lineB = Math.min(255, lineB);

			for(var i = 0; i < 5; i++)
			{
					mainContext.beginPath();
					mainContext.moveTo(0, (y1 * i) % mainHeight);
					mainContext.lineTo(mainWidth, (y1 * i) % mainHeight);
					mainContext.strokeStyle=rgbToHex(lineR,lineG,lineB);
					mainContext.stroke();
			}
	}

	function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

	function changeTitleColor()
	{
			titleR = Math.floor(Math.random() * 255);
			titleG = Math.floor(Math.random() * 255);
			titleB = Math.floor(Math.random() * 255);

			titleDiv.style.color = rgbToHex(titleR, titleG, titleB);
			var color1 = rgbToHex(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
			var color2 = rgbToHex(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
			var color3 = rgbToHex(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
			var color4 = rgbToHex(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
			titleDiv.style.textShadow=" -15px 0 "+color1+", 0 15px "+color2+", 15px 0 "+color3+", 0 -15px "+color4;


	}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}
