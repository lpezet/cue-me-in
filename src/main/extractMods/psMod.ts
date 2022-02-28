import * as ChildProcess from "child_process";
// const EOL = new RegExp(/(\r\n)|(\n\r)|\n|\r/);
import { EOL } from "os";
import { ExtractMod } from "./mod";

export interface PsModSpecs {
  pid?: string | number;
}

/**
 * @param specs
 * @return Promise<string>
 */
export function runPs(specs: PsModSpecs): Promise<string> {
  const spawn = ChildProcess.spawn;
  // if (isWin) {
  // return Promise.reject(new Error("No Windows support at the moment."));
  // }
  return new Promise((resolve, reject) => {
    const args = ["au"];
    if (specs.pid) args.push(`-p ${specs.pid}`);

    // "-o %cpu,%mem,acflag,args,comm,command,cpu,etime,flags,gid,inblk,jobc,ktrace,ktracep,lim,logname,lstart,majflt,minflt,msgrcv,msgsnd,nice,nivcsw,nsigs,nswap,nvcsw,nwchan,oublk,p_ru,paddr,pagein,pgid,pid,ppid,pri,re,rgid,rss,ruid,ruser,sess,sig,sigmask,sl,start,state,svgid,svuid,tdev,time,tpgid,tsess,tsiz,tt,tty,ucomm,uid,upr,user,utime,vsz,wchan,wq,wqb,wqr,wql,xstat";
    const child = spawn("ps", args);
    let stdout = "";
    let stderr: string | null = null;

    child.stdout.on("data", function (data) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      stdout += data.toString();
    });

    child.stderr.on("data", function (data) {
      if (stderr === null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        stderr = data.toString();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        stderr += data.toString();
      }
    });

    child.on("exit", function () {
      if (stderr) {
        return reject(new Error(stderr.toString()));
      } else {
        resolve(stdout || "");
      }
    });
  });
}

export type hint = {
  id: string;
  label: string;
  justified: string;
};

const HEADER_HINTS: { [key: string]: hint } = {
  USER: {
    id: "user",
    label: "USER",
    justified: "left",
  },
  PID: {
    id: "pid",
    label: "USER",
    justified: "right",
  },
  "%CPU": {
    id: "percCpu",
    label: "USER",
    justified: "right",
  },
  "%MEM": {
    id: "percMem",
    label: "USER",
    justified: "right",
  },
  VSZ: {
    id: "vsz",
    label: "VSZ",
    justified: "right",
  },
  RSS: {
    id: "rss",
    label: "RSS",
    justified: "right",
  },
  TT: {
    id: "tt",
    label: "TT",
    justified: "right",
  },
  STAT: {
    id: "stat",
    label: "STAT",
    justified: "left",
  },
  STARTED: {
    id: "started",
    label: "STARTED",
    justified: "right",
  },
  TIME: {
    id: "time",
    label: "TIME",
    justified: "right",
  },
  COMMAND: {
    id: "command",
    label: "COMMAND",
    justified: "left",
  },
};

export type PsHeader = {
  label: string;
  start: number;
  end: number;
};

/**
 * @param line
 */
export function parseHeaders(line: string): PsHeader[] {
  const result: PsHeader[] = [];
  let previousToken: PsHeader | null = null;
  let token: PsHeader | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (/\s/.test(c)) {
      if (token != null) {
        // token.end = i;
        result.push(token);
        previousToken = token;
        token = null;
      }
    } else {
      if (token === null) {
        if (previousToken != null) previousToken.end = i;
        token = { label: "", start: i, end: -1 };
      }
      token.label = token?.label.concat(c);
    }
  }
  if (token != null) {
    token.end = -1;
    result.push(token);
  }
  return result;
}

export type PsData = {
  pid?: string;
  percCpu?: number;
  percMem?: number;
  time?: string;
  command?: string;
  [key: string]: any;
};

/**
 * @param headers
 * @param lines
 */
export function parseLines(headers: PsHeader[], lines: string[]): PsData[] {
  const result: PsData[] = [];
  lines.forEach((line, lineIndex) => {
    // console.log("Working on line #" + lineIndex + "...");
    if (lineIndex > 0) return;
    let headerIndex = 0;
    let header = null;
    let hint = null;
    const d: PsData = {};
    result.push(d);
    while (headerIndex < headers.length) {
      header = headers[headerIndex];
      // console.log(`...using header #${headerIndex}: ${header.label}...`);

      hint = HEADER_HINTS[header.label];
      if (hint == null) {
        console.log(
          "WARNING: Unknown column " + header.label + ". Skipping (no hint)."
        );
      } else {
        // console.log(`......${hint.justified} justified...`);
        if (hint.justified === "left") {
          const start = header.start;
          if (header.end === -1) {
            // console.log(`......using rest of the line from ${start}: ${line.substr(start)}`);

            d[hint.id] = line.substr(start).trim();
          } else {
            const nextHeader = headers[headerIndex + 1];
            const nextHint = HEADER_HINTS[nextHeader.label];
            if (nextHint == null) {
              console.log(
                "WARNING: Unknown column " +
                  nextHeader.label +
                  ". Skipping (no hint (2))."
              );
            } else {
              // console.log(`......checking next header: ${nextHeader.label}`);
              if (nextHint.justified === "left") {
                // console.log("......left justified!!!");
                d[hint.id] = line.substring(start, nextHeader.start).trim();
              } else {
                // console.log(".........right justified!!!");
                let j = nextHeader.start + nextHeader.label.length - 1;
                let c = line[j];
                while (
                  !/\s/.test(c) &&
                  j > header.start + header.label.length - 1
                ) {
                  j--;
                  c = line[j];
                }
                if (!/\s/.test(c)) {
                  console.log(
                    `ERROR: Could not figure out content for ${header.label} at line #${lineIndex}. Skipping (1).`
                  );
                } else {
                  d[hint.id] = line.substring(start, j).trim();
                }
              }
            }
          }
        } else {
          // right justified
          const end = header.start + header.label.length;
          if (header.start === 0) {
            d[hint.id] = line.substring(0, end + 1).trim();
          } else {
            let start = end - 1;
            let c = line[start];
            const previousHeader = headers[headerIndex - 1];
            // console.log(`...start=${start}, end=${end}, c=[${c}], previousHeader.start=${previousHeader.start}`);
            while (
              !/\s/.test(c) &&
              start > previousHeader.start + previousHeader.label.length - 1
            ) {
              start--;
              c = line[start];
            }
            if (!/\s/.test(c)) {
              console.log(
                `ERROR: Could not figure out content for ${header.label} at line #${lineIndex}. Skipping (2).`
              );
            } else {
              // console.log(`......start=${start}, end=${end}.`);
              d[hint.id] = line.substring(start + 1, end).trim();
            }
          }
        }
      }
      headerIndex++;
    }
    // console.log("Line #" + lineIndex + "= " + l);
  });
  return result;
}
/**
 * @param output
 */
export function parsePsOutput(output: string): Promise<PsData[]> {
  const lines: string[] = output.split(EOL); // /(\r\n)|(\n\r)|\n|\r/);
  // console.log("# Got " + lines.length + " lines!");
  const headers = parseHeaders(lines[0]);
  // console.log("# Headers=");
  // console.log(headers);
  const parsedLines = parseLines(headers, lines.slice(1));
  // console.log("# Parsed lines=");
  // console.log(parsedLines);
  return Promise.resolve(parsedLines);
}

export class PsMod implements ExtractMod {
  constructor(private specs?: PsModSpecs) {}
  fetch(): Promise<any> {
    return runPs(this.specs || {}).then(parsePsOutput);
  }
}
