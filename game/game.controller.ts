/* eslint-disable angular/no-controller */


class GameController {
	$scope: ng.IScope;
	static $$ngIsClass: boolean;

	running: boolean;
	step: boolean;

	constructor(){
		this.running = true;
		this.step = false;
	}

	refocusGame(){
		angular.element('canvas').focus();
	}

	pause(): void {
		this.running = !this.running;
	}

	stepFrame(): void {
		this.step = true;
	}
}

GameController.$$ngIsClass = true;

angular
	.module('wge')
	.controller('GameController', GameController);
