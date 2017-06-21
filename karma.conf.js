module.exports = function(config){
	config.set({
		basePath: '',

		files: [
			'src/**/*.module.js',
			'src/**/*.js',
			'tests/karma/**/*.js',
		],

		preprocessors: {
			'src/**/*.js': ['browserify'],
			'tests/**/*.js': ['browserify'],
		},

		browserify: {
			debug: true,
			transform: [
				['babelify', {presets: ['env']}],
			],
		},

		singleRun: true,
		browsers: ['PhantomJS'],
		reporters: ['progress'],

		frameworks: [
			'browserify',
			'jasmine',
		],
		plugins: [
			'karma-browserify',
			'karma-phantomjs-launcher',
			'karma-jasmine',
		],
	});
};
