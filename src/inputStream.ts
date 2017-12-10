interface Location {
  pos: number; // 位置s
  line: number; // 行
  column: number; // 列
}

// 输入流
export default class InputSteam {
  pos = 0; // 位置
  line = 1; // 行
  column = 0; // 列
  input = ''; // 输入字符串
  constructor(input:string) {
    this.input = input;
  }
  next() {
    const ch = this.input.charAt(this.pos++);
    if (ch == '\n') this.line++ , this.column = 0;
    else this.column++;
    return ch;
  }
  peek() {
    return this.input.charAt(this.pos);
  }
  eof() {
    return this.peek() == '';
  }
  croak(msg:string) {
    throw new Error(`${msg} (${this.line}, ${this.column})`);
  }
  getLocation() :Location {
    return {pos: this.pos, line: this.line, column: this.column};
  }
}