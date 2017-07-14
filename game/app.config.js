angular
	.module('wge')
	.config(routeConfig)
	.config(animationConfig)
;

function routeConfig($locationProvider){
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: true,
		rewriteLinks: true,
	});
}

function animationConfig($animateProvider){
	$animateProvider.classNameFilter(/\banimated\b/);
}
