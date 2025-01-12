export const runtime = "edge";
// import { queryD1 } from '../../lib/db';

export default async function handler(req, res) {
    console.log("I am called")
  if (req.method === 'GET') {
    try {
    const query = `
        'SELECT p.id, p.Name, p.synoniem, pc.name AS categoryName, pc.id AS categoryId, pq.name AS quantityName, pq.id as quantityId ' +
    'FROM products p ' +
    'JOIN productCategory pc ON p.categoryType = pc.id ' +
    'JOIN productQuantity pq ON p.quantityType = pq.id ' +
    'ORDER BY p.id DESC;'
    `;
    const products = await queryD1(query);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} else {
  res.status(405).json({ message: 'Method not allowed' });
}
}