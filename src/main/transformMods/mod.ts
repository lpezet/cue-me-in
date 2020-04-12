import { Response } from "../extractMods/httpMod";

class IdentityClass<I> implements Mod<I, I> {
  transform(input: I): Promise<I> {
    return Promise.resolve(input);
  }
}
export const Identity = new IdentityClass();

export const Json: Mod<Response, {}> = {
  transform(input: Response): Promise<{}> {
    return Promise.resolve(JSON.parse(input.body || "{}"));
  }
};

export interface Mod<I, O> {
  transform: (input: I) => Promise<O>;
}
