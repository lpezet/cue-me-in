import { Response } from "../extractMods/httpMod";

class IdentityClass<I> implements TransformMod<I, I> {
  transform(input: I): Promise<I> {
    return Promise.resolve(input);
  }
}
export const Identity = new IdentityClass();

export const Json: TransformMod<Response, {}> = {
  transform(input: Response): Promise<{}> {
    return Promise.resolve(JSON.parse(input.body || "{}"));
  }
};

export interface TransformMod<I, O> {
  transform: (input: I) => Promise<O>;
}
