(function(window, document) {
	var collapsers = $('.collapser').each(function(event){
		console.log('h');
		var wrapper = $(this.closest('.collapser-wrapper'));

		$(this).click(function(event) {
			console.log('hi');
			wrapper.toggleClass('collapsed');
		});
	});
})(window, document);
