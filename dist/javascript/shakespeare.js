
var contentElement = document.getElementById("shakespeareContent");

updateContent();
window.setInterval(function() { updateContent(); }, 1000*5);

function updateContent()
{
	var xhr = new XMLHttpRequest();
	xhr.onload = receivedUpdatedContent;
	xhr.open("GET", "http://neurotischism.com/shakespeare/update", true);
	xhr.send();
	
}

function receivedUpdatedContent()
{
	var newJSON = JSON.parse(this.responseText);
	for(var i = 0; i < newJSON.tweets.length; i++)
	{
		var text = newJSON.tweets[i].text;
		var link = newJSON.tweets[i].link;
		(function(t,l) {setTimeout(function() {addLinkToContent(t, l);}, 5000/newJSON.tweets.length*i)})(text,link);
	}
}

function addLinkToContent(text, link)
{
	var element = document.createElement("a");
	element.href = link;
	element.appendChild(document.createTextNode(text));
	contentElement.appendChild(element);
	element.className = "fade";

}

