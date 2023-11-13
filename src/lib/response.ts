export function json(response: any) {
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
