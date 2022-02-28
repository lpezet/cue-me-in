import { expect } from "chai";
import {
  PsData,
  PsHeader,
  PsMod,
  parseHeaders,
  parseLines,
} from "../../main/extractMods/psMod";

describe("psMod", () => {
  it("basic", (done) => {
    const mod = new PsMod();
    mod.fetch().then(
      (_data) => {
        done();
      },
      (err: Error) => {
        done(err);
      }
    );
  });
  it("parseHeaders", () => {
    const line =
      "USER               PID  %CPU %MEM      VSZ    RSS   TT  STAT STARTED      TIME COMMAND";
    const headers: PsHeader[] = parseHeaders(line);
    // console.log(headers);
    expect(headers).not.null;
    expect(headers.length).equals(11);
    expect(headers[0]).to.deep.equals({ label: "USER", start: 0, end: 19 });
  });
  it("parseLinesMissingHint", () => {
    const lines = ["lucpezet         13272 103.2"];
    const headers: PsHeader[] = [
      { label: "USER", start: 0, end: 19 },
      { label: "PID", start: 19, end: 24 },
      { label: "SOMETHINGWEDONTHAVE", start: 24, end: -1 },
    ];
    const d: PsData[] = parseLines(headers, lines);
    // console.log(d);
    expect(d).not.null;
    expect(d.length).equals(1);
    expect(d[0]).to.deep.equals({
      user: "lucpezet",
      pid: "13272",
    });
  });
  it("parseLinesSingle", () => {
    const lines = [
      "lucpezet         13272 103.2  1.1  9292360 190412   ??  R    Sun03PM   2:53.04 /Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.frame",
    ];
    const headers: PsHeader[] = [
      { label: "USER", start: 0, end: 19 },
      { label: "PID", start: 19, end: 24 },
      { label: "%CPU", start: 24, end: 29 },
      { label: "%MEM", start: 29, end: 39 },
      { label: "VSZ", start: 39, end: 46 },
      { label: "RSS", start: 46, end: 52 },
      { label: "TT", start: 52, end: 56 },
      { label: "STAT", start: 56, end: 61 },
      { label: "STARTED", start: 61, end: 74 },
      { label: "TIME", start: 74, end: 79 },
      { label: "COMMAND", start: 79, end: -1 },
    ];
    const d: PsData[] = parseLines(headers, lines);
    // console.log(d);
    expect(d).not.null;
    expect(d.length).equals(1);
    expect(d[0]).to.deep.equals({
      user: "lucpezet",
      pid: "13272",
      percCpu: "103.2",
      percMem: "1.1",
      vsz: "9292360",
      rss: "190412",
      tt: "??",
      stat: "R",
      started: "Sun03PM",
      time: "2:53.04",
      command:
        "/Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.frame",
    });
  });
});
