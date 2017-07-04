module.exports = function(config){
	config.set({
		basePath: __dirname,

		files: [
			'node_modules/angular/angular.js',
			'node_modules/angular-animate/angular-animate.js',
			'node_modules/angular-route/angular-route.js',
			'node_modules/angular-mocks/angular-mocks.js',
			'game/**/*.module.js',
			'game/**/*.js',
			'src/test.config.js',
			'src/**/*.js',
			'build/*.js',
		],

		preprocessors: {
			'game/**/*.js': ['browserify'],
			'src/**/*.js': ['browserify'],
		},

		browserify: {
			debug: true,
			paths: [
				'node_modules',
				'src',
			],
			transform: [
				['babelify', {presets: ['env']}],
			],
		},

		singleRun: true,
		browsers: ['ChromiumHeadlessNoSandbox'],
		reporters: ['progress'],

		customLaunchers: {
			ChromiumHeadlessNoSandbox: {
				base: 'ChromiumHeadless',
				flags: ['--no-sandbox'],
			},
		},

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
