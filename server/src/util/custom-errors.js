function _createError(name, constructor) {
	var error = function(message) {
		this.message = message;
		this.stack = (new Error()).stack;
		if(constructor) {
			constructor.apply(this, arguments);
		}
	};
	error.prototype = new Error();
	error.prototype.name = name;
	return error;
}

module.exports = {
	NotFoundError: _createError('NotFoundError'),
	TemplateLoadError: _createError('TemplateLoadError', function(message, path, err) {
		this.path = path;
		this.err = err;
		this.message = path + ': ' + message + ': ' +  err.message;
	})
};
