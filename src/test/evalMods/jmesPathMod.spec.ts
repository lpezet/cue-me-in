import { expect } from "chai";
// import * as cheerio from "cheerio";
import { JmesPath } from "../../main/evalMods/jmesPathMod";

describe("jmesPathMod", () => {
  it("basic", async () => {
    const specs = "jmespath:wus";
    const mod = new JmesPath(specs);
    const json = JSON.parse(
      '{"wus": 999, "rank": 123456, "total_users": 1234567890, "active_50": 3, "path": "donor/someone", "wus_cert": "https://apps.foldingathome.org/awards?user=123456789&type=wus", "id": 123456789, "credit_cert": "https://apps.foldingathome.org/awards?user=123456789&type=score", "last": "2020-04-07 03:45:20", "name": "someone", "teams": [{"wus": 999, "last": "2020-04-07 03:45:20", "uid": 123456789, "active_50": 3, "active_7": 3, "credit": 345, "team": 0, "name": "Default (No team specified)"}], "active_7": 3, "credit": 123}'
    );
    const result = await mod.eval(json);
    expect(result).to.be.equals(999);
  });
});
