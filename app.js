var exec = require('child_process').exec;
var compress = require('compression');
var express = require('express');
var bodyParser = require('body-parser');
var requestLib = require('request');
var fs = require('fs');

var captchaPrivateKey = "";
fs.readFile("captchaPrivateKey.txt", {encoding : "utf-8"}, function(err, data) { if(!err) { captchaPrivateKey = data; } else { console.log(err.message); } } );

var app = express();
app.use(compress());
app.use(express.static(__dirname + "/_site"));

app.listen(8080);

app.use(bodyParser.urlencoded({extended: false}));

app.post('/postcomment', function(request, response) 
{
	verifyCaptcha(captchaPrivateKey, request.ip, request.body.recaptcha_challenge_field, request.body.recaptcha_response_field,
		function(captchaError)
		{
			var pageURL = request.body.pageID.replace(/_/g, '/');

			if(!captchaError)
			{
				var date = new Date();
			       	var dateString = date.getUTCFullYear() + "-" +
					("0" + (date.getUTCMonth()+1)).slice(-2) + "-" +
					('0' + (date.getUTCDate())).slice(-2) + "T" +
					('0' + (date.getUTCHours())).slice(-2) + ":" +
					('0' + (date.getUTCMinutes())).slice(-2) + ":" +
					('0' + (date.getUTCSeconds())).slice(-2);

					var messageHTMLModified = request.body.message.replace(/\r/g, '').replace(/\n/g, '<br />');

					postComment(pageURL, request.body.pageID, request.body.author, request.body.email, messageHTMLModified, dateString,
							function() { response.redirect('/' + pageURL); } );
			}
			else
			{
				response.redirect('/incorrectcaptcha');
			}
		}
	);
});

function postComment(pageURL, pageID, author, email, message, dateString, callback)
{
	//jekyll post ids slashes are replaced with underscores for the comment system
        //I used underscores because I will never use underscores in post titles so we can do a global replace on the string to get the original URL back
        //redirect when jekyll has finished building

	console.log(dateString + ": " + author + " (" + email + ") posted a comment on page " + pageID);

	 var commentYaml = "- author: " + author + "\n" +
                                  "  email: " + email + "\n" +
                                  '  message: "' + message + '"\n' +
                                  "  datetime: " + dateString + "\n\n";

        fs.appendFile("source/_data/comments/" + pageID + ".yml", commentYaml, function (err) {if(err){console.log("" + err);}});
        sendMail("nodeserver@neurotischism.com","elliot.hatch@gmail.com",
                "Comment posted on " + pageID + " by " + author,
                "<p>" + commentYaml.replace(/"/g,"'").replace(/\n/g, '<br />') + "</p><p>link: <a href='neurotischism.com/" + pageURL + "'>neurotischism.com/" + pageURL + "</a></p>");
        //regenerate pages
        exec("jekyll build", function(error, stdout, stderr) { console.log(stdout); callback(); });
}

function verifyCaptcha(privateKey, remoteIp, challengeString, responseString, callback)
{
	requestLib.post({ uri: "https://www.google.com/recaptcha/api/verify",
                          form : {privatekey : privateKey,
                                  remoteip : remoteIp,
                                  challenge : challengeString,
                                  response : responseString }},
                        function(captchaError, captchaResponse, captchaBody)
                        {
                                if(!captchaError)
                                {
                                        var captchaResponseArray = captchaBody.split("\n");
                                        if(captchaResponseArray[0] == "true")
                                                callback(null);
                                        else
                                                callback(new Error(captchaResponseArray[1]));
                                }
                                else 
				{ 
					callback(captchaError);
				}
                        }
	);

}

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
