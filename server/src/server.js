var Promise = require('bluebird');
var Path = require('path');
var fs = require('fs');
Promise.longStackTraces();

var http = require('http');
var https = require('https');

var express = require('express');
var bodyParser = require('body-parser');
var compress = require('compression');

var io = require('socket.io');

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

	app.use(compress());
	app.use(bodyParser.urlencoded({extended: false}));
	app.use(bodyParser.json());

	app.use(logger({name: 'neurotischism', reqName: loggerName, level: options.logLevel}));
	app.use(routes({loggerName: loggerName, clientPath: options.clientPath, socketServer: socketServer}));

	if(usingSSL) {
		var httpsPortStr = '';
		if(options.port !== 443) {
			httpsPortStr = ':' + options.port.toString();
		}
		httpServer = http.Server(function(req, res) {
			var host = req.headers['host'].split(':')[0];
			res.writeHead(307, { "Location": "https://" + host + httpsPortStr + req.url });
			res.end();
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
