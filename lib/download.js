import { createWriteStream, existsSync, unlink } from 'fs';
import * as fs from "fs/promises";
import http from 'http';
import https from 'https';
import { asAbsolutePath } from './util.js';
import { logger } from './logger.js';

/**
 * Downloads file from remote HTTP[S] host and puts its contents to the
 * specified location.
 */
async function download(url, filePath) {
  const proto = !url.charAt(4).localeCompare('s') ? https : http;

  return new Promise((resolve, reject) => {
    const file = createWriteStream(filePath);
    let fileInfo = null;

    const request = proto.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }

      fileInfo = {
        mime: response.headers['content-type'],
        size: parseInt(response.headers['content-length'], 10),
      };

      response.pipe(file);
    });

    const timeout = 1000 * 10;
    const id = setTimeout(() => {
      unlink(filePath, () => reject("download timeout " + timeout + " ms"));
    }, timeout);

    // The destination stream is ended by the time it's called
    file.on('finish', () => {
      clearTimeout(id)
      resolve(fileInfo)
    });

    request.on('error', err => {
      unlink(filePath, () => reject(err));
    });

    file.on('error', err => {
      unlink(filePath, () => reject(err));
    });

    request.end();
  });
}

export async function download2(urls, allowCache = true) {
  let downed = false;
  if (!Array.isArray(urls)) urls = [urls]
  let filename = urls[0].replace(/[/\\:\*\?\"<>|]+/g, "_");
  const tmpfilePath = asAbsolutePath('tmp/' + "_" + filename);
  const filePath = asAbsolutePath('tmp/' + filename);

  const errors = [];
  for (const url of urls) {
    try {
      const info = await download(url, tmpfilePath);
      const text = await fs.readFile(tmpfilePath, "utf-8");
      if (typeof text === "string" && text.length > 0) {
        await fs.copyFile(tmpfilePath, filePath)
      }
      logger.info(3, `downloaded ${url}${info}`)
      downed = true;
      break
    } catch (error) {
      logger.info(3, `failed to download ${url}`)
      errors.push({ url, error })
      continue
    }
  }

  if (!downed) {
    if (allowCache && existsSync(filePath)) {
      logger.info(4, `load ${urls} from cache`);
    } else {
      console.error(errors)
      throw new Error("download failed", errors)
    }
  }

  const content = await fs.readFile(filePath, "utf-8");
  return content;
}

export default download;