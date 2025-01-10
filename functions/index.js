export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean); // Split path into parts
  console.log(url)
  // Route to `/api/products` or `/api/products/:id` handlers
  if (pathParts[0] === 'api' && pathParts[1] === 'products') {
    // Dynamically import the products.js file and call its handler
    const productsHandler = await import('./api/products.js');
    return productsHandler.onRequest(context);
  }

  // Default 404 response for unmatched routes
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}
