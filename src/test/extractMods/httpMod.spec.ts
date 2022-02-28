import { expect } from "chai";
// import * as cheerio from "cheerio";
import { HttpMod, Response } from "../../main/extractMods/httpMod";
import * as http from "http";
import * as portfinder from "portfinder";
import { fail } from "assert";

const _getPort = portfinder.getPortPromise;

describe("httpMod", () => {
  /*
  it("missingSpecs", (done) => {
    const mod = new HttpMod();
    mod.fetch().then(
      () => {
        done("Expected error.");
      },
      (_error: Error) => {
        done();
      }
    );
  });
  */
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
      fail(error);
    });

    return _getPort().then(async (port) => {
      server.listen(port); // , function() {});
      const url = `http://localhost:${port}/`;
      const mod = new HttpMod(url);
      return mod.fetch().then().catch(fail);
    });
  });

  it("statusCode400", async () => {
    const server = http.createServer(function (
      _req: http.IncomingMessage,
      res: http.ServerResponse
    ): void {
      res.statusCode = 400;
      res.write("");
      res.end();
      server.close();
    });
    server.on("error", (error: Error) => {
      fail(error);
    });

    return await _getPort().then((port) => {
      server.listen(port); // , function() {});
      const url = `http://localhost:${port}/`;
      const mod = new HttpMod(url);
      return mod
        .fetch()
        .then((res: Response) => {
          expect(res.statusCode).equals(400);
        })
        .catch(fail);
    });
  });

  it("connectionTimeout", async () => {
    const server = http.createServer(function (
      _req: http.IncomingMessage,
      res: http.ServerResponse
    ): void {
      setTimeout(() => {
        res.end();
        server.close();
      }, 1000);
    });
    server.on("error", (error: Error) => {
      fail(error);
    });
    return _getPort().then((port) => {
      server.listen(port);
      const url = `http://localhost:${port}/`;
      const mod = new HttpMod({ url, timeout: 100 });
      return mod
        .fetch()
        .then(() => {
          fail("Expected error!");
        })
        .catch(() => {
          // nop
        });
    });
  });

  it("connectionRefused", async () => {
    return _getPort().then(async (port) => {
      // server.listen(port);
      const url = `http://localhost:${port}/`;
      const mod = new HttpMod({ url, timeout: 100 });
      return mod
        .fetch()
        .then(() => {
          fail("Expected error!");
        })
        .catch(() => {
          // nop
        });
    });
  });
});
