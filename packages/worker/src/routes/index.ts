export async function RouteIndex() {
  return new Response(
    `
    <h1>onepipe</h1>

    <p>
      This is a <a href="https://developers.cloudflare.com/workers/">Cloudflare Worker</a> that receives Segment events and sends them to <a href="https://cloud.google.com/bigquery">BigQuery</a>.
    </p>

    <hr />

    <button 
      onclick="fetch('/t', { method: 'POST', 
        body: JSON.stringify({ type: 'track', userId: '123', event: 'my_test_event', anonymousId: '000', properties: { my_property: 'test' } }),
        headers:  { 'Content-Type': 'application/json' }
      })">
      Trigger track event
    </button>
  
  `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
