export enum ExpressionType {
  Program = 'Program',
  Block = 'BlockExpression',
  IF = 'IFExpression',
  SpecialAssignment = 'SpecialAssignmentExpression',
  Assignment = 'AssignmentExpression',
  Call = 'CallExpression',
  Identifier = 'Identifier',
  Binary = 'BinaryExpression',
  Number = 'Number',
  Operator = 'Operator',
  Punctuation = 'Punctuation',
}

export interface Expression {
  type: ExpressionType;
}

export interface Program extends Expression {
  type: ExpressionType.Program;
  body: Expression[];
}

export interface BinaryExpression extends Expression {
  type: ExpressionType.Binary;
  operator: OperatorLiteral;
  left: AtomExpression;
  right: AtomExpression;
}

export interface CallExpression extends Expression {
  type: ExpressionType.Call;
  callee?: CallExpression | Identifier;
  arguments: AtomExpression[];
}

export interface AssignmentExpression extends Expression {
  type: ExpressionType.Assignment;
  left: Identifier;
  right: AtomExpression;
}

export interface SpecialAssignmentExpression extends Expression {
  type: ExpressionType.SpecialAssignment;
  left: Identifier;
  arguments: AtomExpression[];
}

export interface IFExpression extends Expression {
  type: ExpressionType.IF;
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
  value: string;
}

export interface BlockExpression extends Expression {
  type: ExpressionType.Block;
  body: Expression[];
}

export interface OperatorLiteral extends Expression {
  type: ExpressionType.Operator;
  value: string; // '+' | '-' | '*' | '/' | '%' | '||' | '&&' | '>' | '>=' | '<=' | '<' | '=' | '!=' | ':' | ':='
}

export interface PunctuationLiteral extends Expression {
  type: ExpressionType.Punctuation;
  value: string; // ',' | ';' | '(' | ')' | '{' | '}'
}

export type AtomExpression = Identifier | NumberLiteral | CallExpression | BinaryExpression;

export type Token = Identifier | NumberLiteral | PunctuationLiteral | OperatorLiteral;