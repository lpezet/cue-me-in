import { expect } from "chai";
// import * as cheerio from "cheerio";
import { CMI, CMIClass } from "../main";
import { Response } from "../main/extractMods/httpMod";
import * as http from "http";
import * as portfinder from "portfinder";

const _getPort = portfinder.getPortPromise;

describe("index", () => {
  it("invalidWhat", () => {
    const builder = CMI.builder();
    expect(() => {
      builder.what("");
    }).to.throw("Invalid specs [] for what.");
  });
  it("invalidHow", () => {
    const builder = CMI.builder();
    expect(() => {
      builder.how("");
    }).to.throw("Invalid specs [] for how.");
  });
  it("basic", async () => {
    const server = http.createServer(function (
      _req: http.IncomingMessage,
      res: http.ServerResponse
    ): void {
      res.write(
        '{"wus": 999, "rank": 123456, "total_users": 1234567890, "active_50": 3, "path": "donor/someone", "wus_cert": "https://apps.foldingathome.org/awards?user=123456789&type=wus", "id": 123456789, "credit_cert": "https://apps.foldingathome.org/awards?user=123456789&type=score", "last": "2020-04-07 03:45:20", "name": "someone", "teams": [{"wus": 999, "last": "2020-04-07 03:45:20", "uid": 123456789, "active_50": 3, "active_7": 3, "credit": 345, "team": 0, "name": "Default (No team specified)"}], "active_7": 3, "credit": 123}'
      );
      res.end();
      server.close();
    });
    server.on("error", (error: Error) => {
      throw error;
    });
    await _getPort().then(async (port) => {
      server.listen(port); // , function() {});
      const url = `http://localhost:${port}/`;
      const cue = CMI.builder()
        .what(url)
        .transform({
          transform(input: Response): Promise<any> {
            const str = input.body || "{}";
            return Promise.resolve(JSON.parse(str));
          },
        })
        .how("jmespath:wus")
        // .initialState("999")
        .build();

      await cue
        .run()
        .should.eventually.equal(
          "83cf8b609de60036a8277bd0e96135751bbc07eb234256d4b65b893360651bf2"
        );
      /*
        .then(
          (hash: string) => {
            console.log("Done! Hash=" + hash);
            expect(hash).to.be.equals(
              "83cf8b609de60036a8277bd0e96135751bbc07eb234256d4b65b893360651bf2"
            );
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
        */
    });
    // expect(true).to.be.true;
  });
});
