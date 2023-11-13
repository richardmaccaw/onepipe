export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function CorsRoute() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  })
}
