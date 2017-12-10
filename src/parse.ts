import TokenStream from "./tokenStream";
import {
  ExpressionType,
  Expression,
  Program,
  CallExpression,
  AtomExpression,
  BlockExpression,
  IFExpression,
  Identifier,
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
  function parseExpression(scope?: ExpressionType[]): Expression {
    if (isSequenceExpression()) {
      return checkMatch(scope, parseBinary(parseItem() as AtomExpression, 0));
    } else if (isIdentifer()) {
      const identifier = tokenStream.peek();
      if (identifier.value === 'IF') { // 条件表达式
        const item = parseItem(true);
        if (item.type === ExpressionType.IFExpression) return checkMatch(scope, item);
        return checkMatch(scope, parseBinary(item, 0));
      }
      tokenStream.next();
      if (isAssign()) { // 声明以及赋值表达式
        const operator = tokenStream.next();
        if (operator.type === ':') {
          const args = [];
          args.push(parseLineExpression());
          while (!tokenStream.eof() && tokenStream.peek().type === ',') {
            tokenStream.next();
            args.push(parseLineExpression());
          }
          return checkMatch(scope, {
            type: ExpressionType.SpecialAssignmentExpression,
            operator,
            left: identifier,
            arguments: args,
          });
        }
        return checkMatch(scope, {
          type: ExpressionType.AssignmentExpression,
          operator,
          left: identifier,
          right: parseExpression([
            ExpressionType.CallExpression,
            ExpressionType.Identifier,
            ExpressionType.SequenceExpression,
            ExpressionType.Number,
            ExpressionType.BinaryExpression,
          ]),
        });
      }
      return checkMatch(scope, parseBinary(identifier, 0));
    } else if (isNumber()) { // 数字
      return checkMatch(scope, parseBinary(parseItem(), 0));
    } else if (isBlock()) {
      const body = delimited('{', '}', ';', parseExpression);
      return { type: ExpressionType.BlockExpression, body } as BlockExpression;
    } else {
      unexpected();
    }
  }
  function parseBinary(left: AtomExpression, myPrec: number): AtomExpression {
    const hisPrec = isBinaryOperator();
    if (hisPrec) {
      if (hisPrec > myPrec) {
        const operator = tokenStream.next();
        let operatorStr: string = operator.type;
        if (operator.type === ExpressionType.Identifier) {
          operatorStr = operator.value === 'OR' ? '||' : '&&';
        }
        return parseBinary({
          type: ExpressionType.BinaryExpression,
          operator: operatorStr,
          left,
          right: parseBinary(parseItem() as AtomExpression, hisPrec)
        }, myPrec);
      }
    }
    return left;
  }
  function parseItem(IFELES = false): AtomExpression | IFExpression {
    if (isSequenceExpression()) {
      let expr: CallExpression = {
        type: ExpressionType.CallExpression,
        callee: null,
        arguments: parseSequenceExpression(),
      };
      while (isSequenceExpression()) {
        expr = {
          type: ExpressionType.CallExpression,
          callee: expr,
          arguments: parseSequenceExpression(),
        };
      }
      return expr;
    } else if (isIdentifer()) {
      const identifier = tokenStream.next();
      if (identifier.value === 'IF') {
        if (isSequenceExpression()) {
          const sequenceExpression = parseSequenceExpression();
          if (sequenceExpression.length === 3) {
            let expr: CallExpression = {
              type: ExpressionType.CallExpression,
              callee: identifier as Identifier,
              arguments: sequenceExpression,
            };
            while (isSequenceExpression()) {
              expr = {
                type: ExpressionType.CallExpression,
                callee: expr,
                arguments: parseSequenceExpression(),
              };
            }
            return expr;
          } else if (sequenceExpression.length === 1 && IFELES) {
            return {
              type: ExpressionType.IFExpression,
              test: sequenceExpression[0],
              consequent: parseExpression(),
              alternate: isElse() ? parseExpression() : null,
            };
          } else {
            unexpected();
          }
        } else {
          unexpected();
        }
      }
    } else if (isNumber()) {
      const number = tokenStream.peek();
      tokenStream.next();
      return number as NumberLiteral;
    } else {
      unexpected();
    }
  }
  function parseLineExpression(): Expression {
    return parseExpression([
      ExpressionType.CallExpression,
      ExpressionType.Identifier,
      ExpressionType.SequenceExpression,
      ExpressionType.Number,
      ExpressionType.BinaryExpression,
    ]);
  }
  function parseSequenceExpression(start = '(', stop = ')'): AtomExpression[] {
    return delimited(start, stop, ',', parseLineExpression);
  }
  function isBlock() {
    return tokenStream.peek() && tokenStream.peek().type === '{';
  }
  function isSequenceExpression() {
    return tokenStream.peek() && tokenStream.peek().type === '(';
  }
  function isIdentifer() {
    return tokenStream.peek() && tokenStream.peek().type === 'Identifier';
  }
  function isElse() {
    return isIdentifer() && tokenStream.peek().value === 'ELSE';
  }
  function isAssign() {
    return tokenStream.peek() && [':', ':='].some(c => tokenStream.peek().type === c);
  }
  function isNumber() {
    return tokenStream.peek() && tokenStream.peek().type === 'Number';
  }
  function checkMatch(scode, target): Expression {
    if (scode && scode.indexOf(target.type) === -1) unexpected();
    return target;
  }
  function isBinaryOperator() {
    const t = tokenStream.peek();
    if (!t) return false;
    if (isIdentifer()) return PRECEDENCE[t.value];
    return PRECEDENCE[t.type];
  }
  function delimited(start, stop, separator, parser) {
    var a = [], first = true;
    skip(start);
    while (!tokenStream.eof()) {
      if (tokenStream.peek().type === stop) break;
      if (first) first = false; else skip(separator);
      if (tokenStream.peek().type === stop) break;
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

