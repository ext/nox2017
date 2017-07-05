module.exports = function(bundler){
	bundler.ignore('lapack');
	bundler.plugin(require('tsify'), {
		target: 'es2017',
	});
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
