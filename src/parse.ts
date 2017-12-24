import TokenStream from "./tokenStream";
import {
  ExpressionType,
  Expression,
  Program,
  CallExpression,
  AtomExpression,
  IFExpression,
  Identifier,
  BinaryExpression,
  NumberLiteral,
  OperatorLiteral,
} from './expression';

const PRECEDENCE = {
  '||': 2, 'OR': 2,
  '&&': 3, 'AND': 3,
  '<': 7, '>': 7, '<=': 7, ">=": 7, "=": 7, "!=": 7,
  "+": 10, "-": 10,
  "*": 20, "/": 20, "%": 20,
};

// 解析token流生成ast树
export default function parse(tokenStream: TokenStream): Program {
  return parseProgram();
  function parseProgram(): Program {
    var program: Expression[] = [];
    while (!tokenStream.eof()) {
      program.push(parseExpression());
      if (!tokenStream.eof()) skip(';');
    }
    return { type: ExpressionType.Program, program };
  }
  function parseExpression(): Expression {
    if (isSequenceExpression()) {
      return mayBeBinary(parseAtom() as AtomExpression, 0);
    } else if (isIdentifer()) {
      const identifier = tokenStream.peek();
      if (identifier.value === 'IF') { // 条件表达式
        return parseAtom(true);
      }
      tokenStream.next();
      if (isAssign()) { // 声明以及赋值表达式
        const operator = tokenStream.next();
        if (operator.value === ':') {
          const args = [];
          args.push(parseAtom());
          while (!tokenStream.eof() && tokenStream.peek().value === ',') {
            tokenStream.next();
            args.push(parseAtom());
          }
          if (!tokenStream.eof() && tokenStream.next().value !== ';') unexpected();
          return {
            type: ExpressionType.SpecialAssignment,
            operator,
            left: identifier,
            arguments: args,
          };
        }
        return {
          type: ExpressionType.Assignment,
          operator,
          left: identifier,
          right: parseAtom(),
        };
      }
      return mayBeBinary(identifier as Identifier, 0);
    } else if (isNumber()) { // 数字
      return mayBeBinary(parseAtom() as AtomExpression, 0);
    } else if (isBlock()) {
      const body = delimited('{', '}', ';', parseExpression);
      return {type: ExpressionType.Block, body};
    } else {
      unexpected();
    }
  }
  function mayBeBinary(left: AtomExpression, myPrec = 0): AtomExpression {
    const hisPrec = isBinaryOperator();
    if (left && hisPrec && hisPrec > myPrec) {
      const operator = tokenStream.next();
      const binary: BinaryExpression = {
        type: ExpressionType.Binary,
        operator: operator as OperatorLiteral,
        left,
        right: mayBeBinary(parseAtom() as AtomExpression, hisPrec)
      };
      return mayBeBinary(binary, myPrec);
    }
    return left;
  }
  function mayBeCall(callee?:CallExpression|Identifier): CallExpression|Identifier {
    if (isSequenceExpression()) {
      return parseCallExpression(callee);
    }
    return callee;
  }
  function parseCallExpression(callee?: CallExpression | Identifier) {
    return mayBeCall({
      type: ExpressionType.Call,
      callee,
      arguments: parseSequenceExpression(),
    });
  }
  function parseAtom(IFELES = false): AtomExpression | IFExpression {
    if (isSequenceExpression()) return parseCallExpression();
    if (isIdentifer()) {
      const identifier = tokenStream.next();
      if (identifier.value === 'IF') {
        const sequenceExpression = parseSequenceExpression();
        if (sequenceExpression.length === 3) {
          return mayBeBinary(mayBeCall({
            type: ExpressionType.Call,
            callee: identifier as Identifier,
            arguments: sequenceExpression,
          }));
        } else if (sequenceExpression.length === 1 && IFELES) {
          return {
            type: ExpressionType.IF,
            test: sequenceExpression[0],
            consequent: parseExpression(),
            alternate: isElse() ? parseExpression() : null,
          };
        } else {
          unexpected();
        }
      }
    }
    if (isNumber()) {
      return tokenStream.next() as NumberLiteral;
    }
    unexpected();
  }
  function parseSequenceExpression(start = '(', stop = ')'): AtomExpression[] {
    return delimited(start, stop, ',', parseAtom);
  }
  function isBlock():boolean {
    return tokenStream.peek() && tokenStream.peek().value === '{';
  }
  function isSequenceExpression():boolean {
    return tokenStream.peek() && tokenStream.peek().value === '(';
  }
  function isIdentifer():boolean {
    return tokenStream.peek() && tokenStream.peek().type === 'Identifier';
  }
  function isElse():boolean {
    return isIdentifer() && tokenStream.peek().value === 'ELSE';
  }
  function isAssign():boolean {
    return tokenStream.peek() && [':', ':='].some(c => tokenStream.peek().value === c);
  }
  function isNumber():boolean {
    return tokenStream.peek() && tokenStream.peek().type === ExpressionType.Number;
  }
  function isBinaryOperator() {
    const t = tokenStream.peek();
    return !!t && PRECEDENCE[t.value];
  }
  function delimited(start:string, stop:string, separator:string, parser:Function) {
    var a = [], first = true;
    skip(start);
    while (!tokenStream.eof()) {
      if (tokenStream.peek().value === stop) break;
      if (first) first = false; else skip(separator);
      if (tokenStream.peek().value === stop) break;
      a.push(parser());
    }
    skip(stop);
    return a;
  }
  function skip(ch, type = true) {
    const token = tokenStream.next();
    if (!token || token[type ? 'type' : 'value'] !== ch) {
      tokenStream.croak(`Expecting: "${ch}"`);
    }
  }
  function unexpected() {
    tokenStream.croak("Unexpected token: " + JSON.stringify(tokenStream.peek()));
  }
}

