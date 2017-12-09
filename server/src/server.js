var Promise = require('bluebird');
var Path = require('path');
var fs = require('fs');
Promise.longStackTraces();

var http = require('http');
var https = require('https');

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compress = require('compression');

var io = require('socket.io');
var ioCookieParser = require('socket.io-cookie-parser');

var routes = require('./routes');
var logger = require('./util/logger');

var app;
var httpServer;
var httpsServer;
var socketServer;
var isProduction;

function start(options) {
	options = Object.assign({}, options);

	isProduction = process.env.NODE_ENV === 'production';
	
	var loggerName = 'logger';

	if(options.port === undefined) {
		options.port = '8443';
	}
	if(options.httpPort === undefined) {
		options.port = '8080';
	}
	if(options.logLevel === undefined) {
		options.logLevel = 'info';
	}

	console.log(JSON.stringify(options));

	// load passwords
	if(options.mongodb && !options.mongodb.password) {
		try {
			var passwords = JSON.parse(fs.readFileSync('passwords'));
			options.mongodb.password = passwords.mongodb;
		}
		catch(err) {
			if(err.code === 'ENOENT') {
				console.warn('No password file found.');
			}
			else {
				console.error('Failed to load password file: ', err.message);
			}
		}
	}

	var usingSSL = false;
	app = express();
	if(options.certPath === undefined) {
		console.warn("WARNING: SSL certification path not set. Website is NOT SECURE");
		httpsServer = http.Server(app);
	} else {
		var key;
		var cert;
		try {
			key = fs.readFileSync(Path.join(options.certPath, 'key.pem'));
			cert = fs.readFileSync(Path.join(options.certPath, 'cert.pem'));
		}
		catch(err) {
			console.error(err);
		}
		if(!key || !cert) {
			console.warn("WARNING: SSL key or cert not found. Website is NOT SECURE");
			httpsServer = http.Server(app);
		} else {
			httpsServer = https.Server({
				key: key,
				cert: cert
			}, app);
			usingSSL = true;
		}
	}
	socketServer = io(httpsServer);
	socketServer.use(ioCookieParser());

	app.use(compress());
	app.use(bodyParser.urlencoded({extended: false}));
	app.use(bodyParser.json());
	app.use(cookieParser());

	app.use(logger({name: 'neurotischism', reqName: loggerName, level: options.logLevel}));
	app.use(routes({loggerName: loggerName, clientPath: options.clientPath, jwtCertPath: options.jwtCertPath, socketServer: socketServer, mongodb: options.mongodb}));

	if(usingSSL) {
		var httpsPortStr = '';
		if(options.port !== 443) {
			httpsPortStr = ':' + options.port.toString();
		}
		httpServer = http.Server(function(req, res) {
			try {
				var host = req.headers['host'].split(':')[0];
				res.writeHead(307, { "Location": "https://" + host + httpsPortStr + req.url });
				res.end();
			}
			catch(err) {
				console.error(err);
				console.log(req.headers);
				res.writeHead(500);
				res.end();
			}
		});
		httpServer.listen(options.httpPort);
		httpsServer.listen(options.port);
		console.log('HTTPS listening on port ' + options.port);
		console.log('HTTP listening on port ' + options.httpPort);

	} else {
		httpsServer.listen(options.httpPort);
		console.log('HTTP listening on port ' + options.httpPort);
	}
}

function close() {
	if(httpsServer) {
		httpsServer.close();
		app = null;
		httpsServer = null;
	}

	if(httpServer) {
		httpServer.close();
		httpServer = null;
	}
}

module.exports = {
	start: start,
	close: close
};
