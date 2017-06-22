/* eslint-disable angular/no-controller */

import { CanvasController } from './canvas';

class MainController extends CanvasController {
	constructor($element){
		super();
		this.init($element);
		this.clear();
	}
}

MainController.$$ngIsClass = true;

angular
	.module('wge')
	.controller('MainController', MainController);
