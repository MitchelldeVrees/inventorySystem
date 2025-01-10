export const onRequest = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
  
    // Example path: /api/products or /api/products/123
    const pathParts = url.pathname.split('/').filter(Boolean); 
    // pathParts might be ["api", "products"] or ["api", "products", "123"]
  
    const method = request.method.toUpperCase();
  
    // Handle /api/products (no ID)
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'products') {
      if (method === 'GET') {
        // GET /api/products
        return handleGetProducts(env);
      }
      // If you had a POST, you'd do: if (method === 'POST') { ... }
    }
  
    // Handle /api/products/:id (with ID in pathParts[2])
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'products') {
      const id = pathParts[2];
      if (method === 'DELETE') {
        // DELETE /api/products/:id
        return handleDeleteProduct(env, id);
      } else if (method === 'PUT') {
        // PUT /api/products/:id
        const body = await request.json();
        return handleUpdateProduct(env, id, body);
      }
    }
  
    // 404 if no match
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  };
  
  /**
   * GET /api/products
   */
  async function handleGetProducts(env) {
    try {
      const query = `
        SELECT p.id, p.Name, p.synoniem, 
               pc.name AS categoryName, pc.id AS categoryId, 
               pq.name AS quantityName, pq.id AS quantityId
        FROM products p
        JOIN productCategory pc ON p.categoryType = pc.id
        JOIN productQuantity pq ON p.quantityType = pq.id
        ORDER BY p.id DESC;
      `;
      const { results } = await env.DB.prepare(query).all();
      return new Response(JSON.stringify(results), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
  
  /**
   * DELETE /api/products/:id
   */
  async function handleDeleteProduct(env, id) {
    try {
      // Check if product exists in household
      const checkRow = await env.DB.prepare(
        'SELECT 1 FROM household WHERE product_id = ?'
      ).bind(id).first();
  
      if (checkRow) {
        // Product found in household => Cannot delete
        return new Response(JSON.stringify({
          error: 'Product is present in the household table and cannot be deleted.',
        }), { status: 400 });
      }
  
      // No row => Safe to delete
      await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({
        message: `Product with ID ${id} deleted successfully.`,
      }), { status: 200 });
  
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
  
  /**
   * PUT /api/products/:id
   */
  async function handleUpdateProduct(env, id, body) {
    const { name, categoryId, quantityId, synoniem } = body;
  
    try {
      await env.DB.prepare(
        `UPDATE products
         SET name = ?,
             categoryType = ?,
             quantityType = ?,
             synoniem = ?
         WHERE id = ?`
      )
        .bind(name, categoryId, quantityId, synoniem, id)
        .run();
  
      const responseObj = {
        message: `Product with ID ${id} updated successfully.`,
        id,
        name,
        categoryId,
        quantityId,
        synoniem,
      };
  
      return new Response(JSON.stringify(responseObj), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
  