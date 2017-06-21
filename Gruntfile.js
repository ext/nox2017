const fs = require('fs');
const crypto = require('crypto');
const serveStatic = require('serve-static');

module.exports = function(grunt){
	require('load-grunt-tasks')(grunt);

	grunt.registerTask('serve', [
		'connect', 'watch',
	]);

	grunt.registerTask('build', [
		'clean', 'sass', 'postcss', 'build:js', 'build:libs', 'nunjucks', 'copy',
	]);

	grunt.registerTask('build:libs', [
		'uglify:libs',
	]);

	grunt.registerTask('build:js', [
		'eslint', 'md2html', 'html2js', 'browserify',
	]);

	grunt.registerTask('manifest', 'Create deploy manifest', manifest);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		clean: {
			default: [
				'build',
				'public/assets',
			],
		},

		sass: {
			options: {
				includePaths: [
					'node_modules/font-awesome/scss/',
					'node_modules/foundation-sites/scss/',
					'src',
				],
			},
			default: {
				src: 'scss/<%=pkg.files.css%>.scss',
				dest: 'build/<%=pkg.files.css%>.css',
			},
		},

		postcss: {
			options: {
				processors: [
					require('autoprefixer'),
					require('cssnano'),
				],
			},
			default: {
				src: '<%=sass.default.dest%>',
				dest: 'public/assets/css/<%=pkg.files.css%>.min.css',
			},
		},

		md2html: {
			default: {
				options: {},
				files: [{
					expand: true,
					cwd: 'src',
					src: ['**/*.md'],
					dest: 'build/docs',
					ext: '.html',
				}],
			},
		},

		html2js: {
			default: {
				options: {
					module: 'internal.templates',
					rename: function(name){
						if (name.match(/^..\/build/)){
							name = name.replace('../build/', '');
							return `/${name}`;
						}
						return `/templates/${name}`;
					},
				},
				src: [
					'build/docs/**/*.html',
					'src/**/*.html',
					'!src/layout/*.html',
				],
				dest: 'build/templates.js',
			},
		},

		eslint: {
			default: {
				src: [
					'Gruntfile.js',
					'src/**/*.js',
					'tests/e2e/**/*.js',
					'tests/unit/**/*.js',
				],
			},
		},

		karma: {
			default: {
				configFile: 'karma.conf.js',
			},
		},

		protractor: {
			chrome: {
				options: {
					configFile: 'tests/e2e/protractor-chrome.conf.js',
				},
			},
			chromeHeadless: {
				options: {
					configFile: 'tests/e2e/protractor-chrome-headless.conf.js',
				},
			},
		},

		browserify: {
			default: {
				options: {
					transform: [
						['babelify', {presets: ['env']}],
					],
				},
				src: 'src/app.js',
				dest: 'public/assets/js/<%=pkg.files.js%>.min.js',
			},
		},

		uglify: {
			options: {
				mangle: true,
			},
			libs: {
				files: {
					'public/assets/js/<%=pkg.files.libs%>.min.js': [
						'node_modules/jquery/dist/jquery.js',
						'node_modules/foundation-sites/vendor/modernizr/modernizr.js',
					],
				},
			},
		},

		nunjucks: {
			options: {
				data: {},
				configureEnvironment: configureNunjucks,
			},
			index: {
				src: 'src/index.njk',
				dest: 'public/index.html',
			},
		},

		copy: {
			fonts: {
				expand: true,
				cwd: 'node_modules/font-awesome/fonts',
				src: '*',
				dest: 'public/assets/fonts/',
			},
		},

		connect: {
			options: {
				port: 1337,
				middleware: function(){
					var middlewares = [];
					middlewares.push(serveRewrite);
					middlewares.push(serveStatic('public'));
					return middlewares;
				},
			},
			default: {
			},
		},

		watch: {
			md: {
				files: ['src/**/*.md'],
				tasks: ['md2html', 'html2js', 'browserify'],
			},
			html: {
				files: ['<%=html2js.default.src%>', '!build/docs/**/*.html'],
				tasks: ['html2js', 'browserify'],
			},
			js: {
				files: ['<%=eslint.default.src%>'],
				tasks: ['eslint', 'browserify'],
			},
			scss: {
				files: ['scss/**/*.scss', 'src/**/*.scss'],
				tasks: ['sass', 'postcss'],
			},
			index: {
				files: ['src/*.njk'],
				tasks: ['nunjucks'],
			},
		},
	});
};

function configureNunjucks(env){
	const pkg = require('./package.json');
	env.addFilter('assetUrl', assetHash);
	env.addGlobal('pkg', pkg);
	env.addGlobal('files', {
		css: `css/${pkg.files.css}.min.css`,
		js: `js/${pkg.files.js}.min.js`,
		libs: `js/${pkg.files.libs}.min.js`,
	});
	env.addGlobal('now', Math.round((new Date()).getTime() / 1000));
}

function assetHash(asset){
	const filename = `public/assets/${asset}`;
	if (fs.existsSync(filename)){
		const data = fs.readFileSync(filename);
		const hash = crypto.createHash('md5').update(data).digest('hex');
		return `assets/${asset}?${hash}`;
	} else {
		console.log(`${filename} does not exist when trying to calculate asset hash.`);
		return `assets/${asset}`;
	}
}

function manifest(){
	fs.writeFileSync('./manifest.json', JSON.stringify({
		branch: process.env.CI_COMMIT_REF_NAME,
		slug: process.env.CI_COMMIT_REF_SLUG,
		env: process.env.CI_ENVIRONMENT_NAME,
		commit: process.env.CI_COMMIT_SHA,
		user: process.env.GITLAB_USER_ID,
	}, undefined, 2));
}

function serveRewrite(req, res, next){
	if (req.url.match(/^\/(api|assets|templates)\//)){
		next();
		return;
	}
	res.writeHead(200, {"Content-Type": "text/html"});
	fs.createReadStream('public/index.html').pipe(res);
}
