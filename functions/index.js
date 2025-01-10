export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean); // Split path into parts
        console.log(url)
      // Route `/api/products` or `/api/products/:id` to the appropriate handler
      if (pathParts[0] === 'api' && pathParts[1] === 'products') {
        const productsHandler = await import('./api/products.js');
        return productsHandler.onRequest({ request, env, ctx });
      }

      if (pathParts[0] === 'api' && pathParts[1] === 'helloworld') {
        const productsHandler = await import('./api/helloworld.js');
        return productsHandler.onRequest({ request, env, ctx });
      }
  
      // Default 404 response for unmatched routes
      return new Response(JSON.stringify({ error: 'Not found  INDEX>JS' }), { status: 404 });
    },
  };
  