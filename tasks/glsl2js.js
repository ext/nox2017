const path = require('path');

module.exports = function(grunt){

	grunt.registerMultiTask('glsl2js', 'Assemble shaders to js-file', function(){
		const options = this.options({
			module: 'glsl',
		});
		let n = 0;
		this.files.forEach((f) => {
			const result = {};
			f.src.forEach((src) => {
				result[src] = process(src);
			});
			grunt.file.write(f.dest, format(options.module, result));
			n += f.src.length;
		});
		grunt.log.writeln("Successfully converted " + ("" + n).green +
											" glsl shaders to js.");
	});

	function process(src){
		const stem = path.dirname(src);
		const parsed = grunt.file.readYAML(src);
		parsed.pass = parsed.pass.map((pass) => {
			['vertex', 'fragment'].forEach((key) => {
				const filename = path.join(stem, pass[key]);
				pass[key] = grunt.file.read(filename);
			});
			return pass;
		});
		return parsed;
	}

	function format(module, result){
		let output = '';
		const modules = Object.keys(result).map((cur) => {
			return `"${transform(cur)}"`;
		}).join(', ');

		output += `angular.module('${module}', [${modules}]);\n\n`;

		for (var [filename, value] of Object.entries(result)){
			const module = transform(filename);
			const data = JSON.stringify(value);
			output += `angular.module("${module}", []).run(["$templateCache", function ($templateCache) {\n`;
			output += `  $templateCache.put("${module}", ${data});\n`;
			output += `}]);\n`;
		}

		return output;
	}

	function transform(filename){
		return `/${filename}`;
	}

};
