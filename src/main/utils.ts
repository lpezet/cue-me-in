import * as http from "http";
import * as https from "https";
import * as crypto from "crypto";

/*
const http = require("http");
const https = require("https");
*/

export interface RequestOptions {
  method: string; // "GET" | "POST" | "HEAD" | "OPTIONS" | "PUT" | "DELETE" | "PATCH";
  headers?: { [key: string]: string };
  path?: string;
  hostname?: string;
  port?: number;
}

export const hashToHex = (value: any): string => {
  const hash = crypto.createHash("sha256");
  let toHash = "";
  if (value) {
    if (typeof value === "object") {
      toHash = JSON.stringify(value);
    } else {
      toHash = value.toString();
    }
  }
  hash.update(toHash);
  return hash.digest("hex");
};

export const request = async (
  url: string,
  options: RequestOptions,
  postData = undefined
): Promise<string> => {
  const lib = url.startsWith("https://") ? https : http;

  const urlObj = new URL(url);
  // const [h, path] = url.split("://")[1].split("/");
  // const [host, port] = h.split(":");
  const params = JSON.parse(JSON.stringify(options)); // make a copy
  params.host = params.host || urlObj.host;
  params.port =
    params.port || urlObj.port || url.startsWith("https://") ? 443 : 80;
  params.path = params.path || urlObj.pathname || "/";

  return new Promise((resolve, reject) => {
    console.log("#### Request options:");
    console.log(params);
    const req = lib.request(params, (res: http.IncomingMessage) => {
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`));
      }

      const data: any[] = [];

      res.on("data", (chunk: any) => {
        data.push(chunk);
      });

      res.on("end", () => resolve(Buffer.concat(data).toString()));
    });

    req.on("error", reject);

    if (postData) {
      req.write(postData);
    }

    // IMPORTANT
    req.end();
  });
};
/*
(async () => {
  try {
    const data = await request(
      'https://the-showman-and-the-g-clef-u8pmjbhb7ixy.runkit.sh',
    );
    console.log(data);
  } catch (error) {
    console.error(error);
  }
})();
*/
