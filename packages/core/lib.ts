export function json(response: any) {
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function assertString(input: any): asserts input is string {
  if (typeof input !== 'string') {
    throw new Error('Input is not a string')
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
} 