import { glMock } from 'gl-mock';

describe('MapService', function(){

	let mockMap;
	let service;
	//let $rootScope;
	let gl;

	beforeEach(angular.mock.module('wge', ($provide) => {
		$provide.value('$templateCache', {
			get: () => mockMap,
			put: () => undefined,
		});
	}));

	beforeEach(inject(($injector) => {
		service = $injector.get('MapService');
		gl = glMock();
	}));

	describe('fromFile()', () => {

		it('should throw exception if file couldn\'t be loaded', () => {
			mockMap = undefined;
			expect(() => {
				service.fromFile(gl, '/foobar.json');
			}).toThrow(new Error('Failed to load map "/foobar.json", file not found.'));
		});

		it('should handle missing metadata', (done) => {
			mockMap = {};
			expect(service.fromFile(gl, '/foobar.json')).toBeResolved(done);
		});

		it('should load objects', (done) => {
			const mockObjects = [
				{id: 1, type: null, model: null, name: 'foo'},
				{id: 2, type: null, model: null},
			];
			mockMap = {
				layers: [
					{
						type: 'objectgroup',
						objects: mockObjects,
					},
				],
			};
			service.fromFile(gl, '/foobar.json').then((map) => {
				expect(map.getObjects()).toEqual([
					jasmine.objectContaining({id: 1, name: 'foo'}),
					jasmine.objectContaining({id: 2}),
				]);
				expect(map.getObjectByName('foo')).toEqual(jasmine.objectContaining({id: 1, name: 'foo'}));
				done();
			});
		});

	});

});
