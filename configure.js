module.exports = function(bundler){
	bundler.transform(require('babelify'), {
		presets: [
			['env', {
				targets: {
					browsers: ["last 2 Chrome versions"],
				},
			}],
		],
		plugins: ["angularjs-annotate"],
	});
};
