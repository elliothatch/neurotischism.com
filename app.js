var exec = require('child_process').exec;
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
app.use(express.static(__dirname + "/_site"));

app.listen(8080);

app.use(bodyParser.urlencoded({extended: false}));

app.post('/postcomment', function(request, response) {
	var date = new Date();
	var dateString = date.getUTCFullYear() + "-" + 
			("0" + (date.getUTCMonth()+1)).slice(-2) + "-" + 
			('0' + (date.getUTCDate())).slice(-2) + "T" + 
			('0' + (date.getUTCHours())).slice(-2) + ":" + 
			('0' + (date.getUTCMinutes())).slice(-2) + ":" + 
			('0' + (date.getUTCSeconds())).slice(-2);
	console.log(dateString + ": " + request.body.author + " (" + request.body.email + ") posted a comment on page " + request.body.pageID);
	var messageHTMLModified = request.body.message.replace(/\r/g, '').replace(/\n/g, '<br />');
	var commentYaml = "- author: " + request.body.author + "\n" + 
				  "  email: " + request.body.email + "\n" +
				  '  message: "' + messageHTMLModified + '"\n' +
				  "  datetime: " + dateString + "\n\n";
	var pageURL = request.body.pageID.replace(/_/g, '/');

	fs.appendFile("source/_data/comments/" + request.body.pageID + ".yml", commentYaml, function (err) {if(err){console.log("" + err);}});
	sendMail("nodeserver@neurotischism.com","elliot.hatch@gmail.com",
	  	"Comment posted on " + request.body.pageID + " by " + request.body.author, 
	  	"<p>" + commentYaml.replace(/"/g,"'").replace(/\n/g, '<br />') + "</p><p>link: <a href='neurotischism.com/" + pageURL + "'>neurotischism.com/" + pageURL + "</a></p>"); 
	//regenerate pages
	exec("jekyll build", function(error, stdout, stderr) { console.log(stdout);
	//jekyll post ids slashes are replaced with underscores for the comment system
	//I used underscores because I will never use underscores in post titles so we can do a global replace on the string to get the original URL back
	//redirect when jekyll has finished building
	response.redirect('/' + pageURL); } );

});

function sendMail(sender, recipient, subject, body)
{
	var mailCommand = 'echo "From: ' + sender +     '\n' +
							'To: ' + recipient +    '\n' +
							'Subject: ' + subject + '\n' +
							'Content-Type: text/html\n'  +
							'MIME-Version: 1.0' +   '\n' +
							'<html><head><title>HTML E-mail</title></head><body>' +
							body +
							'\n</body></html>\n." | sendmail -t';
	exec(mailCommand);
}
