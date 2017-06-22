angular
	.module('wge')
	.config(routeConfig);

function routeConfig($locationProvider){
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: true,
		rewriteLinks: true,
	});
}
