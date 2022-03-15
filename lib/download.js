import { existsSync } from 'fs';
import * as fs from "fs/promises";
import { paths } from './util.js';
import { logger } from './logger.js';
import fetch from 'node-fetch';

const down = new Map()

export async function download2(urls, allowCache = true) {
  if (!Array.isArray(urls)) urls = [urls]
  let filename = urls[0].replace(/[/\\:\*\?\"<>|]+/g, "_");
  const fileDstPath = paths.cache(filename);

  if (down.has(urls[0])) {
    return await fs.readFile(down.get(urls[0]), "utf-8")
  }
  const errors = [];
  for (const url of urls) {
    try {
      logger.info(4, `downloading ${url}`)
      const res = await fetch(url);
      const text = await res.text();
      if (typeof text === "string" && text.length > 0) {
        await fs.writeFile(fileDstPath, text, "utf-8")
        down.set(urls[0], fileDstPath);
        return text;
      }
    } catch (error) {
      logger.info(3, `failed to download ${url}`)
      errors.push({ url, error })
      continue
    }
  }

  if (allowCache && existsSync(fileDstPath)) {
    logger.info(4, `load ${urls} from cache`);
    const content = await fs.readFile(fileDstPath, "utf-8");
    return content;
  } else {
    console.error(errors)
    throw new Error("download failed", errors)
  }
}