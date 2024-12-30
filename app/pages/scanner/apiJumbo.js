// File: pages/api/jumbo.js
export default async function handler(req, res) {
    const { barcode } = req.query;

    if (!barcode) {
        return res.status(400).json({ error: "Barcode is required" });
    }

    const API_URL = `https://mobileapi.jumbo.com/v17/search`;
    const HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:102.0) Gecko/20100101 Firefox/102.0",
    };

    try {
        const response = await fetch(`${API_URL}?q=${barcode}`, { headers: HEADERS });
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data = await response.json();
        const product = data.products?.data?.[0] || null; // Get the first matching product

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        return res.status(200).json({
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.pricing?.price?.value,
            image: product.imageInfo?.primaryView,
        });
    } catch (error) {
        console.error("Error fetching product data:", error);
        return res.status(500).json({ error: "Failed to fetch product details" });
    }
}
