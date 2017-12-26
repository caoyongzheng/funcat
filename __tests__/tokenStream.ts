import InputStream from "../src/inputStream";
import TokenStream from "../src/tokenStream";
import utils from '../src/utils';

test('tokenStream.readWhile', () => {
  const inputStream = new InputStream('  \ta:1,2; IF(true,1,2);');
  const tokenStream = new TokenStream(inputStream);
  expect(tokenStream.readWhile(utils.isInvisible)).toBe('  \t');
  expect(tokenStream.readWhile(utils.isLetter)).toBe('a');
  expect(tokenStream.readWhile(utils.isLetter)).toBe('');
});

test('tokenStream.next()', () => {
  const inputStream = new InputStream('// comment \na:1,2; IF(true,1,2);');
  const tokenStream = new TokenStream(inputStream);
  expect(tokenStream.next()).toEqual({type: 'Identifier', value: 'a'});
  expect(tokenStream.next()).toEqual({"type": "Operator", "value": ":" });
  expect(tokenStream.next()).toEqual({type: 'Number', value: '1'});
  expect(tokenStream.next()).toEqual({ "type": "Punctuation", "value": "," });
  expect(tokenStream.next()).toEqual({type: 'Number', value: '2'});
  expect(tokenStream.next()).toEqual({ "type": "Punctuation", "value": ";" });
  expect(tokenStream.next()).toEqual({type: 'Identifier', value: 'IF'});
  expect(tokenStream.next()).toEqual({ "type": "Punctuation", "value": "(" });
  expect(tokenStream.next()).toEqual({ type: 'Identifier', value: 'true' });
  expect(tokenStream.next()).toEqual({ "type": "Punctuation", "value": "," });
  expect(tokenStream.next()).toEqual({ type: 'Number', value: '1' });
  expect(tokenStream.next()).toEqual({ "type": "Punctuation", "value": "," });
  expect(tokenStream.next()).toEqual({ type: 'Number', value: '2' });
  expect(tokenStream.next()).toEqual({ "type": "Punctuation", "value": ")" });
  expect(tokenStream.next()).toEqual({ "type": "Punctuation", "value": ";" });
  expect(tokenStream.next()).toEqual(null);
});