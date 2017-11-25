var fs = require('fs');
var Path = require('path');
var querystring = require('querystring');
var Promise = require('bluebird');
var express = require('express');
var Moment = require('moment-timezone');
var MongoDb = require('mongodb');
var MongoClient = MongoDb.MongoClient;
var bcrypt = require('bcrypt');
var jsonwebtoken = require('jsonwebtoken');

Promise.promisifyAll(MongoDb);
Promise.promisifyAll(MongoClient);

var CustomErrors = require('../util/custom-errors');

/* Constructs a freshr-authentication instance which has two properties:
 * exoressRouter - an express middleware which accepts POST ~authentication/login, which generates a JWT for the user, POST ~authentication/users for adding users, and enforces authentication to the route patterns passed in options. if the user is authenticated, their information is added to the freshr-handler context
 * freshrHandler - a Freshr middleware for the login page
 * users are stored to mongodb in the 'users' collection as a document with the following fields:
 *    username{string}
 *    password{string}: hashed password
 *    email{string}
 *    role{string}: 'admin' or 'user'
 *    timestamp {string}: ISO timestamp when the user was created
 *
 * parameters:
 * options{object}
 * - jwtCertPath{string}
 * - mongodbHost {string}
 * - mongodbDatabase {string}
 * - matchPatterns {string[]} - array of url patterns which will invoke the comment middleware (actually hit the db) defaults to []. use ['/', '/*'] to match all urls
 *      urls can contain any url, optionally suffixed with '/*', which denotes that only subpaths should be matched (e.g. '/games/*' matches all games sub paths but not '/games' itself)
 */
module.exports = function(options) {
	options = Object.assign({}, options);

	if(options.jwtCertPath) {
		try {
			options.jwtPrivateKey = fs.readFileSync(Path.join(options.jwtCertPath, 'key.pem'));
			options.jwtPublicKey = fs.readFileSync(Path.join(options.jwtCertPath, 'cert.pem'));
		}
		catch(err) {
			console.error(err);
		}
	}

	if(!options.jwtPublicKey || !options.jwtPrivateKey) {
		//console.warn("WARNING: JWT key or cert not found. Website is NOT SECURE");
		throw new Error('Freshr-authentication: JWT private or public key not found.');
	}

	if(!options.mongodbHost) {
		options.mongodbHost = '127.0.0.1';
	}
	if(!options.mongodbDatabase) {
		options.mongodbDatabase = 'freshr-authentication';
	}

	if(!options.matchPatterns) {
		options.matchPatterns = [];
	}

	//TODO: maybe give the user control over the database (pass in db, manage auto-reconnect?)
	//TODO: auto-reconnect
	var dbUrl = 'mongodb://' + options.mongodbHost + '/' + options.mongodbDatabase;
	//wrapper for pass by reference, I guess
	var dbWrap = {};
	connectMongoDb(dbUrl).then(function(db) {
		dbWrap.db = db;
		return db.collection('users').ensureIndexAsync({username: 1}, {unique: true});
	}).catch(function(err) {
		console.error('freshr-authentication: ensure index username failed', err);
	});

	return {
		expressRouter: makeExpressRouter(options, dbWrap),
		freshrHandler: makeFreshrHandler(options, dbWrap),
		freshrConfig: makeFreshrConfig(options)
	};

};

function makeFreshrConfig(options) {
	return {};
}

function makeExpressRouter(options, dbWrap) {
	var router = express.Router();

	router.post('/~authentication/login', function(req, res, next) {
		if(!dbWrap.db) {
			return res.status(502).send('Cannot connect to freshr-authentication database');
		}

		if(!req.body.username || !req.body.password) {
			return next(new CustomErrors.UnauthorizedError('username and password required'));
		}

		var tokenPayload;

		dbWrap.db.collection('users').findOne({
			username: req.body.username,
		}).then(function(user) {
			if(!user) {
				throw new CustomErrors.UnauthorizedError('User "' + req.body.username + '" not found');
			}
			tokenPayload = {
				username: user.username,
				email: user.email,
				role: user.role,
				timestamp: user.timestamp
			};
			return bcrypt.compare(req.body.password, user.password);
		}).then(function(result) {
			if(!result) {
				throw new CustomErrors.UnauthorizedError('username and password did not match');
			}

			var token = jsonwebtoken.sign(tokenPayload, options.jwtPrivateKey, {
				algorithm: 'RS256',
				expiresIn: 60*60
			});

			res.cookie('jwt', token, {httpOnly: true, secure: true});
			return res.status(200).send({token: token});
		}).catch(function(err) {
			return next(err);
		});
	});

	router.post('/~authentication/users', function(req, res, next) {
		//TODO: use actual validation instead of a big try-catch
		try {
			if(!dbWrap) {
				return res.status(502).send('Cannot connect to freshr-authentication database');
			}

			var user;
			bcrypt.hash(req.body.password, 8)
				.then(function(hashedPassword) {
					user = {
						username: req.body.username,
						password: hashedPassword,
						email: req.body.email,
						role: req.body.role,
						timestamp: Moment().toISOString()
					};

					console.log(user);

					if(!user.username || !user.password || !user.email || (user.role !== 'admin' && user.role !== 'user')) {
						throw new CustomErrors.BadRequestError('User must have a username, password, email, and role (admin or user)');
					}
					return dbWrap.db.collection('users').insertOneAsync(user);
				}).then(function(result) {
					var queryString = querystring.stringify({username: user.username, role: user.role, timestamp: user.timestamp});
					res.redirect(req.url.substring(0, req.url.lastIndexOf('/') + '/users?' + queryString));
				}).catch(function(err) {
					next(err);
				});
		}
		catch(err) {
			return next(err);
		}
	});

	router.use(function(req, res, next) {
		try {
			var token = jsonwebtoken.verify(req.cookies.jwt, options.jwtPublicKey, {
				algorithm: 'RS256'
			});
			req.freshrAuthentication = {user: token};
		}
		catch(err) {
			// do nothing
		}
		next();
	});

	options.matchPatterns.forEach(function(matchPattern) {
		router.use(matchPattern.path, function(req, res, next) {
			if(!req.freshrAuthentication) {
				var queryString = querystring.stringify({url: req.originalUrl});
				return res.redirect('/~authentication/login?' + queryString);
			}
			if(!matchPattern.roles.includes(req.freshrAuthentication.user.role)) {
				return res.status(403).send('Insufficient permissions. To view this page, you must have one of the following roles: ' + matchPattern.roles);
			}

			next();
		});
	});

	return router;
}

function makeFreshrHandler(options, dbWrap) {
	return function(next, context, req, res) {
		if(req.freshrAuthentication) {
			context.freshrAuthentication = req.freshrAuthentication;
		}
		return next();
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
			console.log('Freshr authenticate: Connected to mongo database "' + url + '"');
			return db;
		}).catch(function(error) {
			console.error('Freshr authenticate: Failed to connect to mongo database "' + url + '"');
			throw error;
		});
}
