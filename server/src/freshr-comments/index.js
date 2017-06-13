var Moment = require('moment-timezone');
module.exports = function (context, req, res) {
	context.comments = [
		{isowner: true, author: '[neurotischism', message: 'hello ' + context.url, timestamp: Moment().toISOString()},
	];
};
