var Promise = require('bluebird');
var express = require('express');
var Moment = require('moment-timezone');
var MongoDb = require('mongodb');
var MongoClient = MongoDb.MongoClient;

Promise.promisifyAll(MongoDb);
Promise.promisifyAll(MongoClient);

var CustomErrors = require('../util/custom-errors');

//TODO: bundle with HTML partial
//TODO: add pagination?
//TODO: add captcha (tokens required to use?)

/* Constructs a freshr-comments instance which has two properties:
 * exoressRouter - an express middleware which accepts POSTs to any url as published comments, using req.url as the url stored in the database
 * freshrHandler - a Freshr middleware for loading comments with MongoDb
 * comments are stored to mongodb as a document with the following fields:
 *    url {string}: url of the page commented on
 *    author {string}
 *    email {string}
 *    message {string}
 *    timestamp {string}: ISO timestamp
 *    verified {boolean}
 *
 * parameters:
 * options{object}
 * - mongodbHost {string}
 * - mongodbDatabase {string}
 * - matchPatterns {string[]} - array of url patterns which will invoke the comment middleware (actually hit the db) defaults to ['/', '/*'] (all urls)
 *      urls can contain any url, optionally suffixed with '/*', which denotes that only subpaths should be matched (e.g. '/games/*' matches all games sub paths but not '/games' itself)
 * - authorPasswords {map[string]:string} - maps authors to passwords. if a posted comment has a password that matches the author, the comment will given a "verified" tag
 * - email {object}: if set, whenever a comment is posted, an email is sent by 'exec'ing 'sendmail'
 *		- sender {string} - email of the sending server
 *		- recipient {string} - email of the recipient of email notifications
 *		- domainName {string} - domain name of the website (for email links, should put this in a global config)
 * - afterCommentFunction {function(object)} - if set, this function is called after a comment is saved to the database. The comment object is passed to the function
 */
module.exports = function(options) {
	options = Object.assign({}, options);
	if(!options.mongodbHost) {
		options.mongodbHost = '127.0.0.1';
	}
	if(!options.mongodbDatabase) {
		options.mongodbDatabase = 'freshr-comments';
	}

	if(!options.matchPatterns) {
		options.matchPatterns = ['/*', '/'];
	}

	if(!options.authorPasswords) {
		options.authorPasswords = {};
	}

	//TODO: maybe give the user control over the database (pass in db, manage auto-reconnect?)
	//TODO: auto-reconnect
	var dbUrl = 'mongodb://' + options.mongodbHost + '/' + options.mongodbDatabase;
	//wrapper for pass by reference, I guess
	var dbWrap = {};
	connectMongoDb(dbUrl).then(function(db) {
		dbWrap.db = db;
	});

	return {
		expressRouter: makeExpressRouter(options, dbWrap),
		freshrHandler: makeFreshrHandler(options, dbWrap)
	};

}

function makeExpressRouter(options, dbWrap) {
	var router = express.Router();

	router.post('*', function(req, res, next) {
		//TODO: use actual validation instead of a big try-catch
		try {
			if(!dbWrap) {
				return res.status(502).text('Cannot connect to comments database');
			}

			var comment = {
				url: req.url,
				author: req.body.author,
				email: req.body.email,
				message: req.body.message,
				timestamp: Moment().toISOString(),
				verified: !!(options.authorPasswords[req.body.author] && req.body.password === options.authorPasswords[req.body.author]),
			}

			if(!comment.url || !matchUrlPatterns(req.url, options.whitelist)) {
				throw new CustomErrors.BadRequestError('Comments can only be added to pages supporting comments');
			} else if(!comment.author || !comment.email || !comment.message) {
				throw new CustomErrors.BadRequestError('Comment must have an author, email, and message');
			}
			dbWrap.db.collection('comments').insertOneAsync(comment)
				.then(function(result) {
					//TODO: add query parameter to mark comment success/failed
					res.redirect(req.url);
					//post-comment actions
					if(options.email && options.email.sender && options.email.recipient && options.email.domainName) {
						var fullUrl = options.domainName + comment.url;
						sendEmail(options.email.sender, options.email.recipient,
								'Comment posted on ' + comment.url + ' by ' + comment.author,
								'<p>' + comment.message.replace(/\n/g, '<br/>') + '</p><p>link: <a href="' + fullUrl + '">' + fullUrl + '</a></p>');
					}
					if(options.afterCommentFunction) {
						afterCommentFunction(comment);
					}
				}).catch(function(err) {
					next(err);
				});
			//{isowner: true, author: '[neurotischism', message: 'hello ' + context.url, timestamp: Moment().toISOString()},
		}
		catch(err) {
			next(err);
		}
	});

	return router;
}

function makeFreshrHandler(options, dbWrap) {
	return function(next, context, req, res) {
		if(!matchUrlPatterns(context.url, options.matchPatterns)) {
			return next();
		}

		/*
		if(!db) {
			connectMongoDb(dbUrl).then(function(d) {
				db = d;
			}).catch(function(err) {
				//TODO: error
				return next();
			});
		}
		*/

		if(!dbWrap.db) {
			return next();
		}

		dbWrap.db.collection('comments').find({
			url: context.url
		}).project({ url: false})
		.toArrayAsync().then(function(comments) {
			context.comments = comments;
			next();
		});
		//context.comments = [
			//{isowner: true, author: '[neurotischism', message: 'hello ' + context.url, timestamp: Moment().toISOString()},
		//];
	};
}

function matchUrlPatterns(url, matchPatterns) {
	for(var i = 0; i < matchPatterns.length; i++) {
		var pattern = matchPatterns[i];
		if(pattern.substring(pattern.length - 2) === '/*') {
			//prefix matching
			pattern = pattern.substring(0, pattern.length - 2);
			if(url.length > pattern.length && url.startsWith(pattern)) {
				return true;
			}
		} else {
			if(url === pattern) {
				//TODO: make this smart about trailing slashes
				return true;
			}
		}
	}

	return false;
}

function connectMongoDb(url) {
	return MongoClient.connectAsync(url)
		.then(function(db) {
			//TODO: provide result to user instead of writing directly to stdout?
			console.log('Freshr comments: Connected to mongo database "' + url + '"');
			return db;
	}).catch(function(error) {
		console.error('Freshr comments: Failed to connect to mongo database "' + url + '"');
		throw error;
	});
}


function sendEmail(sender, recipient, subject, body) {
	var mailCommand =
		'echo "From: ' + sender + '\n' +
		'To: ' + recipient +      '\n' +
		'Subject: ' + subject +   '\n' +
		'Content-Type: text/html\n'    +
		'MIME-Version: 1.0' +     '\n' +
		'<html><head><title>HTML E-mail</title></head><body>' +
		body +
		'\n</body></html>\n." | sendmail -t';
	exec(mailCommand);
}
