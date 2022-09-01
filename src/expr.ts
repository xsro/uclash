import { config } from "./config";
import getRandomEmoji from "./util/randomEmoji";

export function add(a: number, b: number) {
  return a + b;
}

export function expr(str_: string, options: { "replaceAt": boolean }) {
  let str = " " + str_ + " ";
  if (options.replaceAt) {
    for (const m of str.matchAll(/[\s]+(\w+)@([\w,]*)\s+/g)) {
      const [full, caller, param] = m
      str = str.replace(caller + "@" + param, `${caller}(${param})`)
    }
  }
  const env: { [id: string]: any } = {
    rE: getRandomEmoji,
    rEv: getRandomEmoji(),
    cO: config.curl ? config.curl.appOpts : undefined,
    cU: config.cURL
  }
  for (const k of Object.getOwnPropertyNames(Math)) {
    env[k] = (<any>Math)[k]
  }
  env["apis"] = Object.keys(env)

  const func = Function(...Object.keys(env), `return (${str})`);
  const val = func(...Object.values(env))

  return val;
}

export default expr
