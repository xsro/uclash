import { existsSync } from 'fs';
import * as fs from "fs/promises";
import { config, paths } from './util.js';
import { logger } from './logger.js';
import fetch, { AbortError } from 'node-fetch';
import { execSync } from 'child_process';

// AbortController was added in node v14.17.0 globally
const AbortController = globalThis.AbortController || await import('abort-controller')

const down = new Map();

/** download resources from urls
 * 
 * @param {string|Array<string>} urls the url to download
 * @param {"allow"|"no"|"first"} cache true for use cache, false for not, `"first"` for use cache instead of download if possible
 * @param {number} timeout the timeout (ms)
 * @returns 
 */
export async function download2(urls, cache = "no") {
  if (!Array.isArray(urls)) urls = [urls]
  let filename = urls[0].replace(/[/\\:\*\?\"<>|]+/g, "_");
  const fileDstPath = paths.cache(filename);

  if (cache === "first" && existsSync(fileDstPath)) {
    return await fs.readFile(fileDstPath, "utf-8")
  }
  if (down.has(urls[0])) {
    return await fs.readFile(down.get(urls[0]), "utf-8")
  }
  const errors = [];
  for (const url of urls) {
    const controller = new AbortController();
    const timeoutId = config.get("download-timeout") > 0 ? setTimeout(() => {
      controller.abort();
    }, config.get("download-timeout")) : null;
    try {
      let text = "";
      if (config.get("downloader")) {
        try {
          let cmd = config.get("downloader").includes("{url}")
            ? config.get("downloader").replace("{url}", url)
            : config.get("downloader") + " " + url;
          cmd = cmd.replace("{timeout}", config.get("download-timeout"))
          logger.info(4, cmd)
          text = execSync(cmd, { encoding: "utf-8" })
        } catch (e) { errors.push(e) }
      }
      if (text === "") {
        logger.info(4, `fetching ${url}`);
        const res = await fetch(url, { signal: controller.signal });
        text = await res.text();
      }
      if (typeof text === "string" && text.length > 0) {
        await fs.writeFile(fileDstPath, text, "utf-8")
        down.set(urls[0], fileDstPath);
        return text;
      }
    } catch (error) {
      logger.info(3, `failed to download ${url}`)
      errors.push({ url, error })
      continue
    } finally {
      timeoutId && clearTimeout(timeoutId)
    }
  }

  if (cache === "allow" && existsSync(fileDstPath)) {
    logger.info(4, `load ${filename} from cache`);
    const content = await fs.readFile(fileDstPath, "utf-8");
    return content;
  } else {
    throw new Error("download failed: " + filename, errors)
  }
}