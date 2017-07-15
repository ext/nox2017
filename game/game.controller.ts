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
	selectedBuilding: any;
	money: number;
	lives: number;

	constructor($interval: ng.IIntervalService){
		this.running = true;
		this.step = false;
		this.money = 0;
		this.lives = 0;

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
		const obj = this.buildings[index];
		this.mainCtrl.setBuilding(obj);
		this.selectedBuilding = obj;
	}
}

GameController.$$ngIsClass = true;

angular
	.module('wge')
	.controller('GameController', GameController);
