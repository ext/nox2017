module.exports = function(config){
	config.set({
		basePath: __dirname,

		files: [
			'node_modules/angular/angular.js',
			'node_modules/angular-animate/angular-animate.js',
			'node_modules/angular-route/angular-route.js',
			'node_modules/angular-mocks/angular-mocks.js',
			'src/test.config.js',
			'src/**/*.module.js',
			'src/**/*.js',
		],

		preprocessors: {
			'src/**/*.js': ['browserify'],
		},

		browserify: {
			debug: true,
			transform: [
				['babelify', {presets: ['env']}],
			],
		},

		singleRun: true,
		browsers: ['ChromiumHeadless'],
		reporters: ['progress'],

		frameworks: [
			'browserify',
			'jasmine',
		],

		plugins: [
			'karma-browserify',
			'karma-chrome-launcher',
			'karma-jasmine',
		],
	});
};
