/* eslint-disable angular/no-controller */

import { MainController } from './main.controller';

interface Building {
	name: string;
	cost: number;
	image?: string;
}

class GameController {
	$scope: ng.IScope;
	static $$ngIsClass: boolean;

	running: boolean;
	step: boolean;
	next?: number;
	nextLeft: number;
	buildings: Building[];
	mainCtrl: MainController;

	constructor($interval: ng.IIntervalService){
		this.running = true;
		this.step = false;

		$interval(() => {}, 800);
	}

	registerCanvasController(ctrl: MainController){
		this.mainCtrl = ctrl;
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

	setBuilding(index: number): void {
		this.mainCtrl.setBuilding(this.buildings[index]);
	}
}

GameController.$$ngIsClass = true;

angular
	.module('wge')
	.controller('GameController', GameController);
