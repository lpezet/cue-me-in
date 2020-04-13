export interface EvalMod {
  eval: (input: any) => Promise<string>;
}
