import { curlOpts } from "./util/curl";
import getRandomEmoji from "./util/randomEmoji";


export function add(a: number, b: number) {
  return a + b;
}

export function expr(str: string) {
  const rE = getRandomEmoji
  const cO = curlOpts
  const a = eval(str);
  return a;
}

export default expr
