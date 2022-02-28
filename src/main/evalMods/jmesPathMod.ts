import { EvalMod } from "./mod";
import * as jmespathlib from "jmespath";

export class JmesPath implements EvalMod {
  constructor(private specs: string) {}
  eval(input: any): Promise<any> {
    const query = this.specs.substring("jmespath:".length);
    // console.log("# query=" + query + ", input=" + input);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = jmespathlib.search(input, query);
    return Promise.resolve(res);
  }
}
