export interface Mod {
  eval: (input: any) => Promise<string>;
}
