import { existsSync } from 'fs';
import * as fs from "fs/promises";
import { config, paths } from '../util.js';
import { logger } from '../utils/logger.js';
import fetch, { AbortError } from 'node-fetch';
import { execSync } from 'child_process';
import period from '../utils/period.js';
import { githublink } from '../parser/githublink.js';

// AbortController was added in node v14.17.0 globally
const AbortController = globalThis.AbortController || await import('abort-controller')


/** download resources from urls
 * 
 * @param {string|Array<string>} urls the url to download
 * @param {string} dst the path
 * @param {"allow"|"no"|string} cache use cache to fasten download
 * "allow" for use cache when download failed, 
 * "no" for no use cache,
 *  a interval expression like "30d" for use cache if the cache file is not outdated 
 * @param {number} timeout the timeout (ms)
 * @param {"throw"|undefined} error throw error or not
 * @returns 
 */
export async function download(urls, dst, cache = "no", error) {
  if (!Array.isArray(urls)) urls = [urls]
  let filename = urls[0].replace(/[/\\:\*\?\"<>|]+/g, "_");
  const fileDstPath = dst ?? paths.cache(filename);

  //handle cache
  cache = period.parse(cache)
  if (typeof cache === "number" && existsSync(fileDstPath)) {
    const { mtimeMs } = await fs.stat(fileDstPath);
    logger.info(4, `checking cache: ${Date.now()} - ${mtimeMs} ${Date.now() - mtimeMs < cache ? "<" : ">"} ${cache}`)
    if (Date.now() - mtimeMs < cache) {
      return "already downloaded"
    }
  }

  const timeout = period.parse(config.get("download-timeout"));

  //add mirror to github link
  for (const i in urls) {
    const url = urls[i]
    const githubInfo = githublink.parse(url);
    if (githubInfo && githubInfo.type === "github") {
      const _urls = githublink.format(githubInfo).filter(val => !urls.includes(val));
      urls.splice(i, 1, ..._urls)
    }
  }

  //try to download with user defined downloader
  if (config.get("downloader")) {
    for (const url of urls) {
      const githubInfo = githublink.parse(url);
      if (githubInfo && githubInfo.type === "github") {
        const _urls = githublink.format(githubInfo).filter(val => !urls.includes(val));
        urls.push(..._urls)
        continue
      }
      let cmd = config.get("downloader").includes("{url}")
        ? config.get("downloader").replace("{url}", url)
        : config.get("downloader") + " " + url;

      cmd = cmd.replace("{timeout}", timeout);
      cmd = cmd.replace("{timeout:s}", timeout / 1000);
      cmd = cmd.replace("{dst}", fileDstPath);
      logger.info(4, cmd)
      try {
        const stdout = execSync(cmd, { encoding: "utf-8" });
        if (!cmd.includes(fileDstPath)) {
          await fs.writeFile(fileDstPath, stdout, "utf-8")
        }
        return "ok";
      } catch (e) {
        logger.info(2, e)
      }
    }
  }

  //try to download with nodejs
  for (const url of urls) {
    //https://github.com/node-fetch/node-fetch#request-cancellation-with-abortsignal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout)
    logger.info(4, `fetching ${url}`);
    let res = null;
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error instanceof AbortError) {
        logger.info(4, 'request was aborted due to timeout:' + config.get("download-timeout"));
      } else {
        logger.info(4, error)
      }
      continue
    } finally {
      timeoutId && clearTimeout(timeoutId)
    }
    if (res) {
      const text = await res.text();
      await fs.writeFile(fileDstPath, text, "utf-8")
      return "text";
    }
  }

  if (cache === "allow" && existsSync(fileDstPath)) {
    logger.info(4, `load ${filename} from cache`);
    return "cache";
  }
  else if (error === "throw") {
    throw new Error("download failed", urls, filename, errors)
  }
}

/** download resources from urls
 * 
 * @param {string|Array<string>} urls the url to download
 * @param {"allow"|"no"|string} cache use cache to fasten download
 * "allow" for use cache when download failed, 
 * "no" for no use cache,
 *  a interval expression like "30d" for use cache if the cache file is not outdated 
 * @param {number} timeout the timeout (ms)
 * @param {"throw"|undefined} error throw error or not
 * @returns 
 */
export async function download2(urls, cache = "no", error) {
  await download(urls, undefined, cache, error)
  const content = await fs.readFile(fileDstPath, "utf-8");
  return content;
}