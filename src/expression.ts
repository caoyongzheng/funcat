export enum ExpressionType {
  Program = 'Program',
  IFExpression = 'IFExpression',
  SpecialAssignmentExpression = 'SpecialAssignmentExpression',
  AssignmentExpression = 'AssignmentExpression',
  CallExpression = 'CallExpression',
  Identifier = 'Identifier',
  SequenceExpression = 'SequenceExpression',
  Number = 'Number',
  String = 'String',
  Operator = 'Operator',
  Punctuation = 'Punctuation',
  BinaryExpression = 'BinaryExpression',
  BlockExpression = 'BlockExpression',
}

export interface Expression {}

export interface Program extends Expression {
  type: ExpressionType.Program;
  program: Expression[];
}

export interface BinaryExpression extends Expression {
  type: ExpressionType.BinaryExpression;
  operator: string;
  left: AtomExpression;
  right: AtomExpression;
}

export interface CallExpression extends Expression {
  type: ExpressionType.CallExpression;
  callee?: CallExpression | Identifier;
  arguments: AtomExpression[];
}

export interface AssignmentExpression extends Expression {
  type: ExpressionType.AssignmentExpression;
  operator: ':=';
  left: Identifier;
  right: AtomExpression;
}

export interface SpecialAssignmentExpression extends Expression {
  type: ExpressionType.SpecialAssignmentExpression;
  operator: ':';
  left: Identifier;
  arguments: AtomExpression[];
}

export interface IFExpression extends Expression {
  type: ExpressionType.IFExpression;
  test: AtomExpression;
  consequent: Expression;
  alternate?: Expression;
}

export interface Identifier extends Expression {
  type: ExpressionType.Identifier;
  value: string;
}

export interface NumberLiteral extends Expression {
  type: ExpressionType.Number;
  value: number;
}

export interface BlockExpression extends Expression {
  type: ExpressionType.BlockExpression;
  body: Expression[];
}

export interface OperatorLiteral {
  type: ExpressionType.Operator;
  value: '+' | '-' | '*' | '/' | '%' | '||' | '&&' | '>' | '>=' | '<=' | '<' | '=' | '!=' | ':' | ':=';
}

export interface PunctuationLiteral {
  type: ExpressionType.Punctuation;
  value: ',' | ';' | '(' | ')' | '{' | '}';
}

export type AtomExpression = Identifier | NumberLiteral | CallExpression | BinaryExpression;

export type Token = Identifier | NumberLiteral | PunctuationLiteral | OperatorLiteral;