type IGamePreload = { [key:string]: string[] };

export interface IGameConfig {
	name: string;
	preload: IGamePreload;
}
