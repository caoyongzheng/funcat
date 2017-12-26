import {Expression, ExpressionType, Program, BlockExpression, Identifier, NumberLiteral, CallExpression, BinaryExpression, OperatorLiteral, IFExpression, AssignmentExpression, SpecialAssignmentExpression} from './expression';

export default function makeJS(exp: Expression) :string  {
  switch (exp.type) {
    case ExpressionType.Program:
      return makeProgram(exp as Program);
    case ExpressionType.Block:
      return makeBlock(exp as BlockExpression);
    case ExpressionType.Identifier:
      return makeIdentifier(exp as Identifier);
    case ExpressionType.Number:
      return makeNumber(exp as NumberLiteral);
    case ExpressionType.Call:
      return makeCall(exp as CallExpression);
    case ExpressionType.Binary:
      return makeBinary(exp as BinaryExpression);
    case ExpressionType.Operator:
      return makeOperater(exp as OperatorLiteral);
    case ExpressionType.IF:
      return makeIF(exp as IFExpression);
    case ExpressionType.Assignment:
      return makeAssignment(exp as AssignmentExpression);
    case ExpressionType.SpecialAssignment:
      return makeSpecialAssignment(exp as SpecialAssignmentExpression);
    default:
      throw `unexpected type:${exp.type}`;
  }
}

function makeProgram(exp: Program):string {
  return `${exp.body.map(e => makeJS(e)).join(';')};`;
}

function makeBlock(exp: BlockExpression):string {
  return `{${exp.body.map(e => makeJS(e)).join(';')}}`;
}

function makeIdentifier(exp: Identifier):string {
  return exp.value;
}
function makeNumber(exp: NumberLiteral):string {
  return exp.value;
}

function makeCall(exp: CallExpression):string {
  return `${!!exp.callee ? makeJS(exp.callee) : ''}(${exp.arguments.map(e => makeJS(e)).join(',')})`;
}

function makeBinary(exp: BinaryExpression):string {
  return `${makeJS(exp.left)}${makeJS(exp.operator)}${makeJS(exp.right)}`;
}

function makeOperater(exp:OperatorLiteral):string {
  if (exp.value === 'OR') return '||';
  if (exp.value === 'AND') return '&&';
  return exp.value;
}

function makeIF(exp: IFExpression):string {
  return `if(${makeJS(exp.test)})${makeJS(exp.consequent)};${exp.alternate ? makeJS(exp.alternate) : ''}`;
}

function makeAssignment(exp: AssignmentExpression):string {
  return `const ${makeIdentifier(exp.left)} = ${makeJS(exp.right)}`;
}

function makeSpecialAssignment(exp:SpecialAssignmentExpression):string {
  return `const ${makeIdentifier(exp.left)} = (${exp.arguments.map(arg => makeJS(arg)).join(',')})`;
}