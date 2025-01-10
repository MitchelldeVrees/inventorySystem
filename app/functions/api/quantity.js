// Route: GET /api/quantity

export const onRequest = async (context) => {
    const { request, env } = context;
  
    // Only allow GET
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }
  
    try {
      // Query your D1 database
      const query = 'SELECT * FROM productQuantity ORDER BY id DESC;';
      const { results } = await env.DB.prepare(query).all();
      return new Response(JSON.stringify(results), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  };
  