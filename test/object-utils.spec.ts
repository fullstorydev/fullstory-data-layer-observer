import { expect } from 'chai';
import 'mocha';

import { startsWith } from '../src/utils/object';

const testCase = (target: string, searchString: string, position?: number) => ({
  target,
  searchString,
  position,
});

describe('startsWith', () => {
  const testCases = [
    testCase('foo', 'fo'),
    testCase('foo', 'foo'),
    testCase('fo', 'foo'),
    testCase('foo', 'bar'),
    testCase('foo', 'fo', -100),
    testCase('foo', 'fo', -1),
    testCase('foo', 'fo', 0),
    testCase('foo', 'fo', 1),
    testCase('foo', 'fo', 100),
    testCase('fo', 'foo', -100),
    testCase('fo', 'foo', -1),
    testCase('fo', 'foo', 0),
    testCase('fo', 'foo', 1),
    testCase('fo', 'foo', 100),
    testCase('foo', 'foo', -100),
    testCase('foo', 'foo', -1),
    testCase('foo', 'foo', 0),
    testCase('foo', 'foo', 1),
    testCase('foo', 'foo', 100),
    testCase('foo', 'bar', -100),
    testCase('foo', 'bar', -1),
    testCase('foo', 'bar', 0),
    testCase('foo', 'bar', 1),
    testCase('foo', 'bar', 100),
  ];

  testCases.forEach((tc) => {
    it(`matches String.prototype.startsWith behavior with args: ${JSON.stringify(tc)}`, () => {
      const expected = tc.target.startsWith(tc.searchString, tc.position);
      const actual = startsWith(tc.target, tc.searchString, tc.position);
      expect(actual).to.eq(expected);
    });
  });
});
