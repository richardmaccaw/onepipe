export function assertString(input: any): asserts input is string {
  if (typeof input !== 'string') {
    throw new Error('Input is not a string')
  }
}
