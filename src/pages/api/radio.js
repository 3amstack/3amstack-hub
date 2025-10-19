export async function GET({ url }) {
  const endpoint = url.searchParams.get('endpoint');
  
  if (!endpoint) {
    return new Response('Missing endpoint parameter', { status: 400 });
  }

  try {
    const response = await fetch(`https://de1.api.radio-browser.info${endpoint}`);
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}