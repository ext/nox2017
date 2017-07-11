const fs = require('fs');
const crypto = require('crypto');
const serveStatic = require('serve-static');

const pkg = require('./package.json');

module.exports = function(grunt){
	require('load-grunt-tasks')(grunt);
	grunt.loadTasks('tasks');

	grunt.registerTask('serve', [
		'connect', 'watch',
	]);

	grunt.registerTask('build', [
		'clean', 'sass', 'postcss', 'build:data', 'build:js', 'build:libs', 'nunjucks', 'copy',
	]);

	grunt.registerTask('lint', [
		'eslint',
	]);

	grunt.registerTask('build:libs', [
		'uglify:libs',
	]);

	grunt.registerTask('build:data', [
		'md2html', 'data2js', 'glsl2js', 'html2js', 'uglify:data',
	]);

	grunt.registerTask('build:js', [
		'eslint', 'karma:default', 'browserify',
	]);

	grunt.registerTask('manifest', 'Create deploy manifest', manifest);

	grunt.initConfig({
		pkg,

		clean: {
			default: [
				'build',
				'public/assets/css',
				'public/assets/js',
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
					module: 'wge.templates',
					rename: function(name){
						if (name.match(/^..\/build/)){
							name = name.replace('../build/', '');
							return `/${name}`;
						}
						return `/templates/${name}`;
					},
				},
				src: [
					'src/**/*.html',
					'game/**/*.html',
				],
				dest: 'build/templates.js',
			},
		},

		data2js: {
			default: {
				options: {
					module: 'wge.data',
				},
				src: [
					'data/**/*.json',
					'data/**/*.yml',
				],
				dest: 'build/data.js',
			},
		},

		glsl2js: {
			default: {
				options: {
					module: 'wge.shaders',
				},
				src: [
					'shaders/**/*.shader.yml',
				],
				dest: 'build/shaders.js',
			},
		},

		eslint: {
			default: {
				src: [
					'Gruntfile.js',
					'src/**/*.js',
					'src/**/*.ts',
					'!src/**/*.d.ts',
					'game/**/*.js',
					'game/**/*.ts',
				],
			},
		},

		karma: {
			default: {
				configFile: 'karma.conf.js',
			},
			dev: {
				configFile: 'karma.conf.js',
				singleRun: false,
				browsers: ['Chromium'],
			},
		},

		browserify: {
			default: {
				options: {
					browserifyOptions: {
						paths: [
							'node_modules',
							'src',
						],
					},
					configure: require('./configure.js'),
				},
				src: 'game/app.js',
				dest: 'public/assets/js/<%=pkg.files.js%>.min.js',
			},
		},

		uglify: {
			options: {
				mangle: true,
			},
			data: {
				files: {
					'public/assets/js/data.min.js': [
						'build/data.js',
						'build/shaders.js',
						'build/templates.js',
					],
				},
			},
			libs: {
				files: {
					'public/assets/js/<%=pkg.files.libs%>.min.js': [
						'node_modules/jquery/dist/jquery.js',
						'node_modules/foundation-sites/vendor/modernizr/modernizr.js',
						'node_modules/angular/angular.js',
						'node_modules/angular-animate/angular-animate.js',
						'node_modules/angular-route/angular-route.js',
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
				src: 'game/index.njk',
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
				livereload: true,
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

		compress: {
			main: {
				options: {
					archive: '<%= pkg.name %>-<%= pkg.version %>.zip',
				},
				files: [
					{
						expand: true,
						cwd: 'public/',
						src: ['**'],
						dest: '/<%= pkg.name %>-<%= pkg.version %>',
					},
				],
			},
		},

		watch: {
			options: {
				livereload: true,
			},
			md: {
				files: ['src/**/*.md'],
				tasks: ['md2html', 'html2js', 'uglify:data'],
			},
			data: {
				files: ['data/**'],
				tasks: ['data2js', 'uglify:data'],
			},
			glsl: {
				files: ['shaders/**/*.glsl', 'shaders/**/*.shader.yml'],
				tasks: ['glsl2js', 'uglify:data'],
			},
			html: {
				files: ['<%=html2js.default.src%>'],
				tasks: ['html2js', 'uglify:data'],
			},
			js: {
				files: ['<%=eslint.default.src%>'],
				tasks: ['eslint', 'karma:default', 'browserify'],
			},
			scss: {
				files: ['scss/**/*.scss', 'src/**/*.scss'],
				tasks: ['sass', 'postcss'],
			},
			index: {
				files: ['game/*.njk'],
				tasks: ['nunjucks'],
			},
		},
	});
};

function configureNunjucks(env){
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
		slug: process.env.CI_COMMIT_TAG,
		env: "staging",
		commit: process.env.CI_COMMIT_SHA,
		user: process.env.GITLAB_USER_ID,
		archive: `${pkg.name}-${pkg.version}.zip`,
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
