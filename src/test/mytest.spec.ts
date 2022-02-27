// import { expect } from "chai";
// import * as cheerio from "cheerio";
import { CMI, CMIClass, CMIOptions } from "../main";
import { Response } from "../main/extractMods/httpMod";
import { JmesPath } from "../main/evalMods/jmesPathMod";
import { PsData, PsMod } from "../main/extractMods/psMod";

describe("mytest", () => {
  it.skip("httpJmesPath", done => {
    const cue = CMI.builder()
      .what("https://stats.foldingathome.org/api/donor/lpezet")
      .transform({
        transform(input: Response): Promise<any> {
          switch (input.contentType) {
            case "application/json":
              return Promise.resolve(JSON.parse(input.body || "{}"));
            case "text/html":
              return Promise.resolve(input.body);
          }
          return Promise.reject(
            new Error(
              "HTTP Response with content-type={input.contentType} not supported."
            )
          );
        }
      })
      .how("jmespath:wus")
      .build();

    cue
      .run()
      .then(
        (hash: string) => {
          console.log("Done! Hash=" + hash);
          done();
        },
        (error: Error) => {
          console.log("Got error????");
          console.log(error);
          done();
        }
      )
      .catch((error: Error) => {
        console.log("Really unexpected error here.");
        console.log(error);
        done();
      });
    // expect(true).to.be.true;
  });
  it.skip("psJmesPath", done => {
    const options: CMIOptions = {
      what: new PsMod({ pid: 342 }),
      how: new JmesPath('jmespath:"%cpu"'),
      transform: {
        transform(input: PsData[]): Promise<{}> {
          console.log("# ps data=");
          console.log(input);
          return Promise.resolve(input[0] || {});
        }
      }
    };
    const cue = new CMIClass(options);

    cue
      .run()
      .then(
        (hash: string) => {
          console.log("Done! Hash=" + hash);
          done();
        },
        (error: Error) => {
          console.log("Got error????");
          console.log(error);
          done();
        }
      )
      .catch((error: Error) => {
        console.log("Really unexpected error here.");
        console.log(error);
        done();
      });
    // expect(true).to.be.true;
  });
});
