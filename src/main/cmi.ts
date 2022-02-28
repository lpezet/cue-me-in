import { ExtractMod } from "./extractMods/mod";
import { EvalMod } from "./evalMods/mod";
import { Identity, TransformMod } from "./transformMods/mod";
import { HttpMod } from "./extractMods/httpMod";
import { JmesPath } from "./evalMods/jmesPathMod";
import { hashToHex } from "./utils";

export interface CMIOptions {
  what: ExtractMod;
  how: EvalMod;
  transform: TransformMod<any, any>;
  hashResult?: boolean;
}

export class CMIClass {
  private options: CMIOptions;
  constructor(options: CMIOptions) {
    this.options = options;
  }
  run(): Promise<any> {
    const what = this.options.what;
    const how = this.options.how;
    const tx = this.options.transform;
    return what
      .fetch()
      .then((result: any) => {
        return tx.transform(result);
      })
      .then((value: any) => {
        return how.eval(value);
      })
      .then((state: any) => {
        // console.log("State=" + state);
        if (this.options.hashResult) state = hashToHex(state);
        return Promise.resolve(state);
      })
      .catch((error: Error) => {
        console.log("Unexpected error!");
        console.log(error);
        return Promise.reject(error);
      });
  }
}

class CMIBuilder {
  private options: Partial<CMIOptions>;
  constructor() {
    this.options = {};
  }

  what(specs: string): CMIBuilder {
    if (specs == null || specs.trim().length == 0) {
      throw new Error(`Invalid specs [${specs}] for what.`);
    }
    const mod: HttpMod = new HttpMod(specs);
    this.options.what = mod;
    return this;
  }
  how(specs: string): CMIBuilder {
    if (specs == null || specs.trim().length == 0) {
      throw new Error(`Invalid specs [${specs}] for how.`);
    }
    // 1. Get scheme
    // 2. [Load mod(s) for scheme]
    // 3. Call eval() using result from what()'s mod, and passing the entire specs.
    // 4. Hash result
    const expr: JmesPath = new JmesPath(specs);
    this.options.how = expr;
    return this;
  }
  transform(mod: TransformMod<any, any>): CMIBuilder {
    this.options.transform = mod;
    return this;
  }
  hashResult(doHash: boolean): CMIBuilder {
    this.options.hashResult = doHash;
    return this;
  }
  build(): CMIClass {
    if (!this.options.what || !this.options.how) {
      throw new Error("Missing what and how.");
    }
    const options: CMIOptions = {
      what: this.options.what,
      how: this.options.how,
      transform: this.options.transform || Identity,
    };
    return new CMIClass(options);
  }
}

export class CMI {
  static builder(): CMIBuilder {
    return new CMIBuilder();
  }
}
