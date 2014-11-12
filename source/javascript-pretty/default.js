var canvas1 = document.getElementById("backgroundCanvas");
	var backgroundContext = canvas1.getContext("2d");
	var mainWidth = document.body.clientWidth;
	var mainHeight = document.body.clientHeight;
	canvas1.width = mainWidth;
	canvas1.height = mainHeight;

var canvas2 = document.getElementById("foregroundCanvas");
	var foregroundContext = canvas2.getContext("2d");
	var mainWidth = document.body.clientWidth;
	var mainHeight = document.body.clientHeight;
	canvas2.width = mainWidth;
	canvas2.height = mainHeight;

	var backgroundY1 = 320;
	var backgroundR = 0;
	var backgroundG = 0;
	var backgroundB = 0;

	var titleDiv = document.getElementById("siteTitle");
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

	var corruptZoneObj = null;
	var isCorruptZoneHovered = false;
	var corruptZoneText;
	var corruptZoneOriginalText;

	var scrollMaxDelay = 30 * 2;

	var commentAuthorOwnerElements = document.getElementsByClassName('commentAuthorOwner');
	var commentAuthorOwnerCycleSpeed = 1;
	var commentAuthorOwnerColorStep = 0.05;
	var commentAuthorOwnerHue = 0.0;

	backgroundContext.fillStyle="#000000";
	backgroundContext.fillRect(0,0,mainWidth,mainHeight);
	window.onresize = onWindowResized;
	window.setInterval(function(){backgroundY1 += 2; backgroundY1 = backgroundY1 % mainHeight; animateBackground();},1000/60);
	window.setInterval(function(){changeTitleColor();},1000/30);
	window.setInterval(function(){updateLinkLetterSpacing();},1000/30);
	window.setInterval(function(){updateRandomCharacters();}, 1000/30);
	window.setInterval(function(){updateScrollLinks();}, 1000/40);
	window.setInterval(function(){updateH1Colors();}, 1000/8);
	window.setInterval(function(){updateH1HoverColoring();}, 1000/30);
	window.setInterval(function(){updateCorruptZone();}, 1000/30);
	window.setInterval(function(){updateCommentAuthorOwner();}, 1000/10);

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

	var corruptZoneElements = document.getElementsByClassName('corruptZone');
	for(i = 0; i < corruptZoneElements.length; i++)
	{
		corruptZoneElements[i].onmouseenter = function() {startCorruptZone(this);};
		corruptZoneElements[i].onmouseleave = function()  {stopCorruptZone();};
	}

	initCommentAuthorOwner();
	updateTrashLinkLineCharacters();
	updateTrashLinkLineCharacters(); //do it twice
	initializeScrollLinks();
	formInit();


	function onWindowResized()
	{
		//resize canvas
		mainWidth = document.body.clientWidth;
		mainHeight = document.body.clientHeight;
		canvas1.width = mainWidth;
		canvas1.height = mainHeight;
		canvas2.width = mainWidth;
		canvas2.height = mainHeight;
		backgroundContext.fillRect(0,0,mainWidth,mainHeight);
		//resize trash links
		updateTrashLinkLineCharacters();
		//resize scrollLinks (destructive :) )
		initializeScrollLinks();
	}

	function initCommentAuthorOwner() 
	{
		for(var i = 0; i < commentAuthorOwnerElements.length; i++)
		{
			var message = commentAuthorOwnerElements[i].innerHTML;
			var newMessage = "";
			for (var j = 0; j < message.length; j++)
			{
				var color = HSVtoRGB(commentAuthorOwnerHue, 1.0, 1.0);
				newMessage += "<span style=\"color:" + rgbToHex(color.r, color.g, color.b) + ";\">" + message[j] + "</span>"
				commentAuthorOwnerHue = commentAuthorOwnerHue + commentAuthorOwnerColorStep;
				if(commentAuthorOwnerHue > 1.0)
					{commentAuthorOwnerHue -= 1.0;}
			}
			commentAuthorOwnerElements[i].innerHTML = newMessage;
		}
	}

	function updateCommentAuthorOwner()
	{
		for(var i = 0; i < commentAuthorOwnerElements.length; i++)
		{
			var children = commentAuthorOwnerElements[i].children;
			for(var j = 0; j < children.length - 1; j++)
			{
				children[j].style.color = children[j+1].style.color;
			}
			var color = HSVtoRGB(commentAuthorOwnerHue, 1.0, 1.0);
			children[children.length - 1].style.color = rgbToHex(color.r, color.g, color.b);
			commentAuthorOwnerHue = commentAuthorOwnerHue + commentAuthorOwnerColorStep;
				if(commentAuthorOwnerHue > 1.0)
					{commentAuthorOwnerHue -= 1.0;}
		}
	}

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
				foregroundContext.strokeStyle=rgbToHex(backgroundR, backgroundG, backgroundB);
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
		if(isLinkHovered && hoveredLink.className != "scrollLink" && hoveredLink.id != "siteTitle")
		{
			linkLetterSpacing += 2;
			hoveredLink.style.letterSpacing = linkLetterSpacing + "px";
		}
	}

	function startCorruptZone(obj)
	{
		isCorruptZoneHovered = true;
		corruptZoneObj = obj;

		corruptZoneOriginalText = [];
		var children = obj.children;
		for(var i = 0; i < children.length; i++)
		{
			corruptZoneOriginalText.push(children[i].innerHTML);
		}
		corruptZoneText = corruptZoneOriginalText.slice(0);
	}

	function stopCorruptZone()
	{
		isCorruptZoneHovered = false;
		var children = corruptZoneObj.children;
		for(var i = 0; i < children.length; i++)
		{
			children[i].innerHTML = corruptZoneOriginalText[i];
		}
	}

	function updateCorruptZone()
	{
		if(isCorruptZoneHovered)
		{
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*_=+,./~`";
			var children = corruptZoneObj.children;
			var randomChild = Math.floor(Math.random() * children.length);
			var newString = "";
			var randomCharIndex = Math.floor(corruptZoneText[randomChild].length * Math.random());
			for(var i = 0; i < corruptZoneText[randomChild].length; i++)
			{
				if(i != randomCharIndex)
					{newString += corruptZoneText[randomChild].charAt(i);}
				else
					{newString += possible.charAt(Math.floor(Math.random() * possible.length));}
			}
			corruptZoneText[randomChild] = newString;
			children[randomChild].innerHTML = newString;
		}
	}

	function animateBackground()
	{

			backgroundR += Math.floor((Math.random() - 0.5) * 50);
			backgroundG += Math.floor((Math.random() - 0.5) * 50);
			backgroundB += Math.floor((Math.random() - 0.5) * 50);

			backgroundR = Math.max(0, backgroundR);
			backgroundG = Math.max(0, backgroundG);
			backgroundB = Math.max(0, backgroundB);
			backgroundR = Math.min(255, backgroundR);
			backgroundG = Math.min(255, backgroundG);
			backgroundB = Math.min(255, backgroundB);

			for(var i = 0; i < 5; i++)
			{
					backgroundContext.beginPath();
					backgroundContext.moveTo(0, (backgroundY1 * i) % mainHeight);
					backgroundContext.lineTo(mainWidth, (backgroundY1 * i) % mainHeight);
					backgroundContext.strokeStyle=rgbToHex(backgroundR,backgroundG,backgroundB);
					backgroundContext.stroke();
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
