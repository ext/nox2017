module.exports = function matchers(){
	jasmine.addMatchers({
		toBeFramebuffer: matchType('Framebuffer'),
		toBeTexture: matchType('Texture'),
	});
};

function matchType(type){
	return function(util, customEqualityTesters){
		return {
			compare: (actual, expected) => {
				const isRightType = util.equals(actual.type, type, customEqualityTesters);
				const hasRightId = !expected || util.equals(actual.id, expected, customEqualityTesters);
				const obj = JSON.stringify(actual);
				const result = {
					pass: isRightType && hasRightId,
				};
				if (result.pass){
					if (isRightType){
						result.message = `Expected ${obj} not to be ${type}`;
					} else {
						result.message = `Expected ${obj} not to have ID ${expected}`;
					}
				} else {
					if (isRightType){
						result.message = `Expected ${obj} to have ID ${expected}`;
					} else {
						result.message = `Expected ${obj} to be ${type}`;
					}
				}
				return result;
			},
		};
	};
}
