export interface IShaderPass {
	vertex: string;
	fragment: string;
}

export interface IShaderData {
	name: string;
	pass: IShaderPass[];
}
