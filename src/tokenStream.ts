import InputStream from "./inputStream";
import utils from "./utils/index";
import {ExpressionType, Token} from './expression';

interface PredicateFunc {
  (ch: string, str?:string): boolean;
}

// token流
export default class TokenStream {
  inputStream: InputStream;
  currentToken: Token;
  constructor(inputStream: InputStream) {
    this.inputStream = inputStream;
  }
  readWhile(predicate: PredicateFunc) :string {
    let str = '';
    while (!this.inputStream.eof() && predicate(this.inputStream.peek(), str + this.inputStream.peek()))
      str += this.inputStream.next();
    return str;
  }
  readNext() :Token {
    this.readWhile(utils.isInvisible);
    if (this.inputStream.eof()) return null;
    let ch = this.inputStream.peek();
    if (ch === '/') {
      this.inputStream.next();
      if (this.inputStream.peek() === '/') { // 单行注释
        this.readWhile(ch => ch !== '\n');
        return this.readNext();
      } else if (this.inputStream.peek() === '*') { // 多行注释
        this.readWhile(ch => ch !== '*');
        while (!this.inputStream.eof() && this.inputStream.peek() !== '/') {
          this.readWhile(ch => ch !== '*');
        }
        return this.readNext();
      } else {
        return {type: ExpressionType.Operator, value: '/'};
      }
    } else if (',;(){}'.indexOf(ch) >= 0) {
      return {type: ExpressionType.Punctuation, value: this.inputStream.next()};
    } else if ('+-*/%=&|<>!:'.indexOf(ch) >= 0) {
      return {
        type: ExpressionType.Operator,
        value: this.readWhile(ch => '+-*/%=&|<>!:'.indexOf(ch) >= 0),
      };
    } else if (utils.isDigit(ch)) { // 
      let hasDot = false;
      const number = this.readWhile(ch => {
        if (ch === '.') {
          if (hasDot) return false;
          hasDot = true;
          return true;
        }
        return utils.isDigit(ch);
      });
      return { type:ExpressionType.Number, value: number};
    } else if (utils.isLetter(ch)) {
      const identifier = this.readWhile(ch => utils.isLetter(ch) || '0123456789'.indexOf(ch) >= 0);
      if (identifier === 'AND' || identifier === 'OR') {
        return {type: ExpressionType.Operator, value: identifier};
      }
      return {type: ExpressionType.Identifier, value: identifier};
    } else {
      this.inputStream.croak("Can't handle character: " + ch);
    }
  }
  next() {
    const token = this.currentToken;
    this.currentToken = null;
    return token || this.readNext();
  }
  peek() {
    return this.currentToken || (this.currentToken = this.readNext());
  }
  eof() {
    return this.inputStream.eof();
  }
  croak(msg:string) {
    return this.inputStream.croak(msg);
  }
}