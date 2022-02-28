import * as http from "http";
import * as https from "https";
import { Duplex } from "stream";
import { ExtractMod } from "./mod";

interface RequestOptions {
  method?: string; // "GET" | "POST" | "HEAD" | "OPTIONS" | "PUT" | "DELETE" | "PATCH";
  headers?: { [key: string]: string };
  path?: string;
  host?: string;
  port?: number;
  timeout?: number; // in ms
}

export interface UrlAndRequestOptions extends RequestOptions {
  url: string;
}

export interface Response {
  aborted: boolean;
  httpVersion: string;
  httpVersionMajor: number;
  httpVersionMinor: number;
  headers: http.IncomingHttpHeaders;
  rawHeaders: string[];
  contentType?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  statusMessage?: string;
  body?: string;
}

const request = (
  url: string,
  options: RequestOptions,
  postData = undefined
): Promise<Response> => {
  const lib = url.startsWith("https://") ? https : http;
  const urlObj = new URL(url);

  // const [h, path] = url.split("://")[1].split("/");
  // const [host, port] = h.split(":");
  const params: RequestOptions = JSON.parse(
    JSON.stringify(options)
  ) as RequestOptions; // make a copy

  params.host = params.host || urlObj.hostname;
  params.port = params.port || parseInt(urlObj.port || "0"); // || (url.startsWith("https://") ? 443 : 80);
  params.path = params.path || urlObj.pathname || "/";
  params.timeout = params.timeout || 1000;
  return new Promise((resolve, reject) => {
    // console.log("#### Request options:");
    // console.log(params);
    try {
      const req = lib.request(params, (res: http.IncomingMessage) => {
        const result: Response = {
          ...res,
          contentType: res.headers["content-type"],
        };
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          // console.log(
          //  "# stopping response here. Got statusCode=" + res.statusCode
          // );
          return resolve(result);
        }

        const data: any[] = [];

        res.on("data", (chunk: any) => {
          // console.log("# getting data...");
          data.push(chunk);
        });
        res.on("end", () => {
          result.body = Buffer.concat(data).toString();
          // console.log("# got all the data! Resolving...");
          resolve(result);
        });
      });

      req.on("error", (error) => {
        // console.log("# Got error during request.");
        reject(error);
      });
      req.on("socket", (s: Duplex) => {
        s.on("timeout", function () {
          // console.log("# socket timeout!!!");
          req.abort();
        });
        s.on("error", (socketError: Error) => {
          // console.log("# Socket error!");
          // console.log(socketError);
          reject(socketError);
        });
      });
      req.on("timeout", () => {
        // console.log("# req timeout!!!");
        req.abort();
        reject(new Error("Timeout"));
      });

      if (postData) {
        req.write(postData);
      }
      // IMPORTANT
      req.end();
    } catch (err) {
      //
      reject(err);
    }
  });
};

export class HttpMod implements ExtractMod {
  constructor(private specs: string | UrlAndRequestOptions) {}
  fetch(): Promise<any> {
    if (!this.specs) {
      return Promise.reject(
        new Error(
          'Must provide either url (string) or options like { url: "", ..}'
        )
      );
    }
    let url: string;
    if (typeof this.specs === "string") {
      url = this.specs;
    } else {
      url = this.specs.url;
    }
    // const url = info; // "https://stats.foldingathome.org/api/donor/lpezet";
    const options = {
      method: (typeof this.specs !== "string" && this.specs.method) || "GET",
      headers: (typeof this.specs !== "string" && this.specs.headers) || {},
      timeout: (typeof this.specs !== "string" && this.specs.timeout) || 1000,
    };
    if (!options.headers["Accept"] && !options.headers["accept"]) {
      options.headers["Accept"] = "application/json";
    }
    return request(url, options);
    /*
    return new Promise((resolve, reject) => {
      request(url, options).then(
        (resp: Response) => {
          console.log("######## Got response???");
          resolve(resp);
          /*
          // console.log("######## Page???");
          // console.log(resp);
          const jsonResult = JSON.parse(resp);
          console.log("######## Result:");
          console.log(jsonResult);

          const result = jmespath.search(jsonResult, "wus");
          console.log(`Wus=${result}`);
          */
    /*
        jq.run(".", '{ foo: "bar" }', { input: "string" }).then(console.log);
        // { "foo": "bar" }

        jq.run(".wus", resp, {
          input: "string",
          output: "string"
        }).then(data => {
          console.log(`## Wus=[${data}]`);
        });
        
        },
        (error: Error) => {
          console.log("######## Someting went wrong!!!!!!!");
          console.log(error);
          reject(error);
        }
      );
    });
    */
  }
}
