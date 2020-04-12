class IdentityClass<I> implements Mod<I, I> {
  transform(input: I): Promise<I> {
    return Promise.resolve(input);
  }
}
export const Identity = new IdentityClass();

export interface Mod<I, O> {
  transform: (input: I) => Promise<O>;
}
