/* eslint-disable angular/no-controller */


class GameController {
	$scope: ng.IScope;
	static $$ngIsClass: boolean;

	running: boolean;
	step: boolean;
	next?: number;
	nextLeft: number;

	constructor($interval: ng.IIntervalService){
		this.running = false;
		this.step = true;

		$interval(() => {}, 800);
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
