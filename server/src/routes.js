var path = require('path');
var express = require('express');

var templating = require('./templating/routes');
var freshrComments = require('./freshr-comments');

/* options (object):
 *   - clientPath {string}: path to client directory, which should contain site/layouts/partials
 *   - silent {boolean}: no output if truthy
 *   - loggerName {string}: name of logger req property name
 */
module.exports = function(options) {
	options = Object.assign({}, options);

	var router = express.Router();

	var comments = freshrComments({
		whitelist: ['/blog/*', '/games/*', '/not-games/*'],
		authorPasswords: {'[neurotischism': 'this is mine'}
	});

	/*
	var innerRouter = express.Router();
	setTimeout(function() {
		console.log('add premiddleware');
		innerRouter.use(function(req, res, next) {
			res.status(200).send('overruled');
		});
	}, 5000);
	innerRouter.use(function(req, res, next) {
		console.log('inner router');
		next();
	});
	router.use(innerRouter);

	router.use(function(req, res, next) {
		res.status(200).send('test');
	});
	*/

	router.use('/comments', comments.expressRouter);
	router.use(templating(options, [comments.freshrHandler]));
	router.use(express.static(path.join(__dirname, '../../client/dist')));
	router.use(express.static(path.join(__dirname, '../../client/src/pages')));
	//TODO: make these part of react plugin express router
	router.use(express.static(path.join(__dirname, '../../node_modules/react/dist')));
	router.use(express.static(path.join(__dirname, '../../node_modules/react-dom/dist')));
	//TODO: make this part of config plugin
	router.use(express.static(path.join(__dirname, '../../node_modules/qrcode/build')));

	router.use(function(err, req, res, next) {
		if(!err.status) {
			err.status = 500;
		}
		if(err.status >= 500) {
			if(options.loggerName && req[options.loggerName]) {
				// put the error on req for the logger
				// make message and stack enumerable so they will be logged
				Object.defineProperty(err, 'message', { enumerable: true });
				Object.defineProperty(err, 'stack', { enumerable: true });
				req[options.loggerName].error = err;
			}

			if(!options.silent) {
				console.error(err.stack);
			}
		}

		res.status(err.status).send(err.message || 'Internal Server Error');
	});



	return router;
};
