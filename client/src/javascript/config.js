(function(window, document) {
	var collapsers = $('.collapser').each(function(event){
		var wrapper = $(this.closest('.collapser-wrapper'));

		$(this).click(function(event) {
			wrapper.toggleClass('collapsed');
		});
	});

	var configSocket = io('/~config');

	configSocket.on('build/start', function(tasks) {
		console.log('build/start', tasks);
	});
	configSocket.on('build/success', function(result) {
		console.log('build/success', result);
	});
	configSocket.on('build/fail', function(error) {
		console.log('build/fail', error);
	});
	configSocket.on('build/task/start', function(taskPath) {
		console.log('build/task/start', taskPath);
	});
	configSocket.on('build/task/log', function(data) {
		console.log('build/task/log', data);
	});
	configSocket.on('build/task/done', function(taskPath) {
		console.log('build/task/done', taskPath);
	});

	configSocket.emit('build');

})(window, document);
