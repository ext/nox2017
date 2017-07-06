/* eslint-env jasmine */

/* install matchers for ES6 promises */
beforeEach(() => require('jasmine-es6-promise-matchers').install);

/* install matchers for custom webgl mock */
beforeEach(require('gl-mock/matchers'));
