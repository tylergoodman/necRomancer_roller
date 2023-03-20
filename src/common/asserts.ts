export function assertExists<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected value \`${val}\` to exist.`);
  }
}
