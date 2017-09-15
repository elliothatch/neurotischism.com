var path = require('path');
var config = require('config');
var parseArgs = require('minimist');
var server = require('./server');

var configOptions = {
	port: config.get('port'),
	httpPort: config.get('httpPort'),
	certPath: config.get('certPath'),
	clientPath: path.resolve(config.get('clientPath')),
	logLevel: config.get('logLevel')
};

server.start(Object.assign({}, configOptions, parseArgs(process.argv.slice(2))));
