import { Mod as ExtractMod } from "./extractMods/mod";
import { Mod as EvalMod } from "./evalMods/mod";
import { Identity, Mod as TxMod } from "./transformMods/mod";
import { HttpMod } from "./extractMods/httpMod";
import { JmesPath } from "./evalMods/jmesPathMod";
import * as crypto from "crypto";

export interface CMIOptions {
  what: ExtractMod;
  how: EvalMod;
  transform: TxMod<any, any>;
  starting?: () => void;
  ending?: () => void;
  initialState?: string;
}

export class CMIClass {
  private options: CMIOptions;
  constructor(options: CMIOptions) {
    this.options = options;
  }
  run(): Promise<string> {
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
        console.log("State=" + state);
        const hash = crypto.createHash("sha256");
        let toHash = "";
        if (state) {
          if (typeof state === "object") {
            toHash = JSON.stringify(state);
          } else {
            toHash = state.toString();
          }
        }
        hash.update(toHash);
        return Promise.resolve(hash.digest("hex"));
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
  transform(mod: TxMod<any, any>): CMIBuilder {
    this.options.transform = mod;
    return this;
  }
  starting(): CMIBuilder {
    // TODO: I want to pass a function to evaluate to know when to start...
    // this.starting =
    return this;
  }
  ending(): CMIBuilder {
    // TODO: I want to pass a function to evaluate to know when to stop...
    // this.options.ending =
    return this;
  }
  initialState(state: string): CMIBuilder {
    // TODO
    this.options.initialState = state;
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
      starting: () => void 0,
      ending: () => void 0,
      initialState: this.options.initialState || ""
    };
    return new CMIClass(options);
  }
}

export class CMI {
  static builder(): CMIBuilder {
    return new CMIBuilder();
  }
}
