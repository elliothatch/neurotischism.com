function _createError(name, status, constructor) {
	var error = function(message) {
		this.message = message;
		this.stack = (new Error()).stack;
		if(constructor) {
			constructor.apply(this, arguments);
		}
	};
	error.prototype = new Error();
	error.prototype.name = name;
	error.prototype.status = status;
	return error;
}

module.exports = {
	BadRequestError: _createError('BadRequestError', 400, function(message, originalError) {
		this.originalError = originalError;
	}),
	NotFoundError: _createError('NotFoundError', 404),
	UnauthorizedError: _createError('UnauthorizedError', 401),
	TemplateLoadError: _createError('TemplateLoadError', 500, function(message, path, err) {
		this.path = path;
		this.err = err;
		this.message = path + ': ' + message + ': ' +  err.message;
	})
};
