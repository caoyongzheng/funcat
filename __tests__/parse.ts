import InputStream from "../src/inputStream";
import TokenStream from "../src/tokenStream";
import parse from '../src/parse';
import makeJS from '../src/makeJS';

test('parse js1', () => {
  const inputs = [
    'a:1,2; IF(true,1,2);',
    '0 AND (1+2)',
  ];
  inputs.forEach(v => {
    const inputStream = new InputStream(v);
    const tokenStream = new TokenStream(inputStream);
    const astTree = parse(tokenStream);
    console.log(makeJS(astTree));
  });
});
