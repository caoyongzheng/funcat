import InputStream from '../src/inputStream';

test('inputStream.next()', () => {
  const inputStream = new InputStream('12\n');
  expect(inputStream.next()).toBe('1');
  expect(inputStream.next()).toBe('2');
  expect(inputStream.next()).toBe('\n');
});

test('inputStream.peek()', () => {
  const inputStream = new InputStream('12\n');
  expect(inputStream.peek()).toBe('1');
  inputStream.next();
  expect(inputStream.peek()).toBe('2');
  inputStream.next();
  expect(inputStream.peek()).toBe('\n');
});

test('inputStream.eof()', () => {
  const inputStream = new InputStream('12\n');
  inputStream.next();
  inputStream.next();
  inputStream.next();
  expect(inputStream.eof()).toBe(true);
});

test('inputStream.croak(wrong ch)', () => {
  const inputStream = new InputStream('1!\n');
  inputStream.next();
  try {
    inputStream.croak('wrong ch');
  } catch (error) {
    expect(error).toEqual(new Error('wrong ch (1, 1)'));
  }
})

test('inputStream.getLocation()', () => {
  const inputStream = new InputStream('1!\n');
  inputStream.next();
  expect(inputStream.getLocation()).toEqual({
    pos: 1, line: 1, column: 1
  });
})