import getRandomEmoji from "./util/randomEmoji";


export function add(a: number, b: number) {
  return a + b;
}

export function expr(str:string) {
  const rE=getRandomEmoji
  const a =eval(str);
  return a ;
}

export default expr
