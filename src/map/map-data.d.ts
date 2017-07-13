import { Vector } from 'sylvester';

export type IMapProperties = { [key:string]: any };

export interface IMapObject {
	width: number;
	height: number;
	x: number;
	y: number;
	type: string;
	name: string;
	properties?: IMapProperties
}

export interface IMapObject {
	position: Vector;
}

export interface IMapLayer {
	data: number[];
	height: number;
	name: string;
	opacity: number;
	type: "tilelayer" | "objectgroup";
	visible: boolean;
	width: number;
	x: number;
	y: number;
	objects?: IMapObject[];
	properties?: IMapProperties
}

export interface IMapTileset {
	columns: number;
	firstgid: number;
	image: string;
	imageheight: number;
	imagewidth: number;
	margin: number;
	name: string;
	spacing: number;
	tilecount: number;
	tileheight: number;
	tilewidth: number;
	properties?: IMapProperties
}

export interface IMapData {
	width: number;
	height: number;
	tilewidth: number;
	tileheight: number;
	type: string
	version: number;
	nextobjectid: number;
	orientation: string;
	renderorder: string;
	tiledversion: string;
	layers: IMapLayer[];
	tilesets: IMapTileset[];
	properties?: IMapProperties
}
