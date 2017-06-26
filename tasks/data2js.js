module.exports = function(grunt){

	grunt.registerMultiTask('data2js', 'Assemble arbitrary data to js-file', function(){
		const options = this.options({
			module: 'data',
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
											" data files to js.");
	});

	function process(src){
		return grunt.file.readYAML(src);
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
		filename = filename.replace(/src\//, '');
		return `/${filename}`;
	}
};
