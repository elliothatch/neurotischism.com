(function(window, document) {
	var collapsers = $('.collapser').each(function(event){
		var wrapper = $(this.closest('.collapser-wrapper'));

		$(this).click(function(event) {
			wrapper.toggleClass('collapsed');
		});
	});

	var socket = io('/');
	var freshrConfigSocket = io.of('/~config');

	//freshrConfigSocket.emit('build');

})(window, document);
