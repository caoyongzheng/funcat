// 字符串输入流处理
function InputStream(input) {
  var pos = 0, line = 1, col = 0;
  return {
    next: next,
    peek: peek,
    eof: eof,
    croak: croak,
    getLoc,
  };
  function next() {
    var ch = input.charAt(pos++);
    if (ch == "\n") line++ , col = 0; else col++;
    return ch;
  }
  function peek() {
    return input.charAt(pos);
  }
  function eof() {
    return peek() == "";
  }
  function croak(msg) {
    throw new Error(msg + " (" + line + ":" + col + ")");
  }
  function getLoc() {
    return {pos, line, col};
  }
}

// 是否是空白符号
const isWhitespace = ch => ' \t\n'.indexOf(ch) >= 0;
// 是否是字母
const isLetter = ch => /[a-zA-Z]/i.test(ch);
// 是否是数字
const isDigit = ch => /[0-9]/i.test(ch);

function TokenStream(inputStream) {
  let currentToken = null;
  function readWhile(predicate) {
    var str = "";
    while (!inputStream.eof() && predicate(inputStream.peek()))
      str += inputStream.next();
    return str;
  }
  function readNext() {
    readWhile(isWhitespace);
    if (inputStream.eof()) return null;
    let ch = inputStream.peek();
    if (ch === '/') {
      inputStream.next();
      if (inputStream.peek() === '/') {
        readWhile(ch => ch !== '\n');
        return readNext();
      } else if (inputStream.peek() === '*') {
        readWhile(cn => ch !== '*');
        while (!inputStream.eof() && inputStream.peek() !== '/') {
          readWhile(cn => ch !== '*');
        }
        return readNext();
      } else {
        return {type: '/'};
      }
    } else if (',;(){}[]'.indexOf(ch) >= 0) { // 标点符号
      return {type: inputStream.next()};
    } else if ('+-*/%=&|<>!:'.indexOf(ch) >= 0) { // 操作符
      return {
        type: readWhile(ch => '+-*/%=&|<>!:'.indexOf(ch) >= 0),
      };
    } else if (isDigit(ch)) { // 
      let hasDot = false;
      const number = readWhile(ch => {
        if (ch === '.') {
          if (hasDot) return false;
          hasDot = true;
          return true;
        }
        return isDigit(ch);
      });
      return {type: "Number", value: Number(number)};
    } else if (isLetter(ch)) {
      const identifier = readWhile(ch => isLetter(ch) || '0123456789'.indexOf(ch) >= 0);
      return {type: 'Identifier', value: identifier};
    } else {
      inputStream.croak("Can't handle character: " + ch);
    }
  }
  function next() {
    const token = currentToken;
    currentToken = null;
    return token || readNext();
  }
  function peek() {
    return currentToken || (currentToken = readNext());
  }
  function eof() {
    return inputStream.eof();
  }

  return {
    eof,
    peek,
    next,
    croak: inputStream.croak,
  }
}

// 解析token流生成ast树
function parse(tokenStream) {
  const PRECEDENCE = {
    "||": 2, 'OR': 2,
    "&&": 3, 'AND': 3,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "=": 7, "!=": 7,
    "+": 10, "-": 10,
    "*": 20, "/": 20, "%": 20,
  };
  return parseProgram();
  function parseProgram() {
    var prog = [];
    while (!tokenStream.eof()) {
      prog.push(parseExpression());
      if (!tokenStream.eof()) skip(';');
    }
    return {type: 'Program', prog};
  }
  function parseExpression(scope) {
    if (isSequenceExpression()) {
      const expr = parseBinary(parseItem(), 0);
      return checkMatch(scope, expr);
    } else if (isIdentifer()) {
      const identifier = tokenStream.peek();
      if (identifier.value === 'IF') { // 条件表达式
        const item = parseItem(true)
        if (item.type === 'IFExpression') return checkMatch(scope, item);
        return checkMatch(scope, parseBinary(item, 0))
      }
      tokenStream.next();
      if (isAssign()) { // 声明以及赋值表达式
        const operator = tokenStream.next();
        if (operator.type === ':') {
          const arguments = [];
          arguments.push(parseLineExpression());
          while (!tokenStream.eof() && tokenStream.peek().type === ',') {
            tokenStream.next();
            arguments.push(parseLineExpression());
          }
          return checkMatch(scope, {
            type: 'SpecialAssignmentExpression',
            operator,
            left: identifier,
            arguments,
          });
        }
        return checkMatch(scope, {
          type: 'AssignmentExpression',
          operator,
          left: identifier,
          right: parseExpression([
            'CallExpression', 'Identifier', 'SequenceExpression', 'Number', 'BinaryExpression'
          ]),
        });
      }
      return checkMatch(scope, parseBinary(identifier, 0));
    } else if (isNumber()) { // 数字
      return checkMatch(scope, parseBinary(parseItem(), 0));
    } else if (isBlock()) {
      const body = delimited('{', '}', ';', parseExpression);
      return { type: 'BlockStatement', body };
    } else {
      unexpected();
    }
  }
  function parseBinary(left, myPrec) {
    const hisPrec = isBinaryOperator();
    if (hisPrec) {
      if (hisPrec > myPrec) {
        const operator = tokenStream.next();
        return parseBinary({
          type: 'BinaryExpression',
          operator,
          left: left,
          right: parseBinary(parseItem(), hisPrec)
        }, myPrec);
      }
    }
    return left;
  }
  function parseItem(IFELES = false) {
    if (isSequenceExpression()) {
      let expr = {
        type: 'SequenceExpression',
        expresions: parseSequenceExpression(),
      };
      while (isSequenceExpression()) {
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: parseSequenceExpression(),
        };
      }
      return expr;
    } else if (isIdentifer()) {
      const identifier = tokenStream.next();
      let expr = identifier;
      if (identifier.value === 'IF') {
        if (isSequenceExpression()) {
          const sequenceExpression = parseSequenceExpression();
          if (sequenceExpression.length === 3) {
            expr = {
              type: 'CallExpression',
              callee: expr,
              arguments: sequenceExpression,
            };
          } else if (sequenceExpression.length === 1 && IFELES) {
            return {
              type: 'IFExpression',
              test: sequenceExpression,
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
      while (isSequenceExpression()) {
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: parseSequenceExpression(),
        };
      }
      return expr;
    } else if (isNumber()) {
      number = tokenStream.peek()
      tokenStream.next();
      return number;
    } else {
      unexpected();
    }
  }
  function parseLineExpression() {
    return parseExpression([
      'CallExpression', 'Identifier', 'SequenceExpression', 'Number', 'BinaryExpression'
    ]);
  }
  function parseSequenceExpression(start = '(', stop = ')') {
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
  function checkMatch(scode, target) {
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
    if (!token || token[type ? 'type' : value] !== ch) {
      tokenStream.croak(`Expecting: "${ch}"`);
    }
  }
  function unexpected() {
    tokenStream.croak("Unexpected token: " + JSON.stringify(tokenStream.peek()));
  }
}

try {
  const ast = parse(TokenStream(InputStream('a:1,2; IF(true,1,2);')))
  console.log(ast);
} catch (error) {
  console.log(error);
}