// 是否是不可见字符
export default (ch:string) :boolean => ' \t\n'.indexOf(ch) >= 0;