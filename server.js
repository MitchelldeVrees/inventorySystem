const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json()); // For parsing JSON request bodies

// Connect to SQLite database
const db = new sqlite3.Database('inventorySystemDB', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

app.get('/api/products', (req, res) => {
  db.all(
    'SELECT p.id, p.Name, p.synoniem, pc.name AS categoryName, pc.id AS categoryId, pq.name AS quantityName, pq.id as quantityId ' +
    'FROM products p ' +
    'JOIN productCategory pc ON p.categoryType = pc.id ' +
    'JOIN productQuantity pq ON p.quantityType = pq.id ' +
    'ORDER BY p.id DESC;',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Endpoint to fetch products
app.get('/api/quantity', (req, res) => {
  db.all('SELECT * FROM productQuantity ORDER BY id DESC;', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint to fetch products
app.get('/api/category', (req, res) => {
  db.all('SELECT * FROM productCategory;', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint to fetch household products with product name and location name
app.get('/api/household-products', (req, res) => {
  const query = `
    SELECT 
    h.id,
    h.product_id,
    p.Name AS productName,
    h.quantity,
    (h.quantity - h.reduced_quantity) AS ActualQuantity,
    h.input_date,
    h.output_date,
    CAST(CEIL(julianday(h.output_date) - julianday('now')) AS INTEGER) AS daysTillExpiry,
    h.location,
    l.name AS locationName
    FROM 
        household h
    JOIN 
        products p ON h.product_id = p.id
    JOIN 
        location l ON h.location = l.id
    WHERE 
        h.used = 0;

  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});




app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  // Check if the product exists in the household table
  db.get('SELECT 1 FROM household WHERE product_id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Error checking household data: ' + err.message });
      return;
    }

    if (row) {
      // If a row exists, product is in household table
      res.status(400).json({ error: 'Product is present in the household table and cannot be deleted.' });
    } else {
      // If no row is found, proceed with deletion
      db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: `Product with ID ${id} deleted successfully.` });
      });
    }
  });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, categoryId, quantityId, synoniem } = req.body; // Receive `synoniem`

  db.run(
    'UPDATE products SET name = ?, categoryType = ?, quantityType = ?, synoniem = ? WHERE id = ?',
    [name, categoryId, quantityId, synoniem, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: `Product with ID ${id} updated successfully.`,
        id,
        name,
        categoryId,
        quantityId,
        synoniem,
      });
    }
  );
});


// Endpoint to add a product to the household table
app.post('/api/household-products', (req, res) => {
  const { productId, quantity, selectedDate, expiryDate, location } = req.body;

  db.run(
    `INSERT INTO household (product_id, quantity, input_date, output_date, location) VALUES (?, ?, ?, ?, ?)`,
    [productId, quantity, selectedDate, expiryDate, location],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Product added to household successfully' });
    }
  );
});

app.post('/api/products', (req, res) => {
  const { name, categoryId, quantityId, synoniem } = req.body; // Receive `synoniem`

  // Validate input
  if (!name || !categoryId || !quantityId) {
    res.status(400).json({ error: 'Please provide name, categoryId, and quantityId' });
    return;
  }

  // Insert new product into the products table
  db.run(
    'INSERT INTO products (Name, categoryType, quantityType, synoniem) VALUES (?, ?, ?, ?)',
    [name, categoryId, quantityId, synoniem || null], // Allow `synoniem` to be optional
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: 'Product added successfully',
        productId: this.lastID, // Return the ID of the new product
      });
    }
  );
});


app.post('/api/household-products/reduce-quantity', (req, res) => {
  const { productId, reduceQuantity } = req.body;

  if (!productId || !reduceQuantity || reduceQuantity <= 0) {
    res.status(400).json({ error: 'Invalid product ID or reduce quantity' });
    return;
  }

  const query = `
    SELECT id, quantity, reduced_quantity,
           (quantity - reduced_quantity) AS available_quantity
    FROM household
    WHERE product_id = ? AND used = 0
    ORDER BY output_date ASC
  `;

  db.all(query, [productId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching product data: ' + err.message });
      return;
    }

    let remainingToReduce = reduceQuantity;
    const updates = [];

    // Reduce quantities directly
    rows.forEach((row) => {
      if (remainingToReduce > 0) {
        const reduction = Math.min(row.available_quantity, remainingToReduce);
        const newReducedQuantity = row.reduced_quantity + reduction;
        const isUsed = (row.quantity - newReducedQuantity) === 0 ? 1 : 0;

        updates.push({
          id: row.id,
          newReducedQuantity,
          used: isUsed,
        });

        remainingToReduce -= reduction;
      }
    });

    // Perform database updates
    const updateQuery = `
      UPDATE household
      SET reduced_quantity = ?, used = ?
      WHERE id = ?
    `;

    const promises = updates.map((update) =>
      new Promise((resolve, reject) => {
        db.run(updateQuery, [update.newReducedQuantity, update.used, update.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      })
    );

    Promise.all(promises)
      .then(() => {
        if (remainingToReduce > 0) {
          // Notify user if full reduction wasn't possible
          res.status(400).json({ error: 'Not enough quantity available to reduce fully' });
        } else {
          res.json({ message: 'Quantity reduced successfully' });
        }
      })
      .catch((error) => {
        res.status(500).json({ error: 'Error updating quantities: ' + error.message });
      });
  });
});

// app.get('/api/find-recipe', (req, res) => {
//   const selectedIngredientIds = req.query.selectedIngredients ? req.query.selectedIngredients.split(',').map(Number) : [];
//   const numPeople = parseInt(req.query.numPeople);

//   if (!selectedIngredientIds.length || isNaN(numPeople)) {
//     res.status(400).json({ error: 'Please provide selected ingredients and the number of people' });
//     return;
//   }

//   const placeholders = selectedIngredientIds.map(() => '?').join(', ');
//   const query = `
//     SELECT *
//     FROM recipes
//     WHERE (product1 IN (${placeholders}) OR product2 IN (${placeholders}) OR product3 IN (${placeholders}) OR product4 IN (${placeholders}) OR product5 IN (${placeholders}))
//   `;

//   db.all(query, selectedIngredientIds, (err, rows) => {
//     if (err) {
//       res.status(500).json({ error: 'Error fetching recipe: ' + err.message });
//       return;
//     }

//     // Filter recipes to ensure sufficient quantity for the specified number of people
//     const validRecipes = rows.filter((recipe) => {
//       let hasAllIngredients = true;

//       for (let i = 1; i <= 5; i++) {
//         const productKey = `product${i}`;
//         const quantityKey = `productQuantity${i}`;

//         if (recipe[productKey]) {
//           const selectedIngredient = selectedIngredientIds.includes(recipe[productKey]);
//           if (!selectedIngredient) {
//             hasAllIngredients = false;
//             break;
//           }

//           // Check if the quantity is sufficient for the number of people
//           const requiredQuantity = recipe[quantityKey] * numPeople / recipe.amountPeople;
//           const ingredient = req.query.selectedIngredients.find(
//             (ing) => ing.id == recipe[productKey]
//           );
//           if (ingredient && ingredient.quantity < requiredQuantity) {
//             hasAllIngredients = false;
//             break;
//           }
//         }
//       }

//       return hasAllIngredients;
//     });

//     if (validRecipes.length > 0) {
//       res.json({ recipe: validRecipes[0] });
//     } else {
//       res.status(404).json({ error: 'No valid recipe found with the selected ingredients and quantity.' });
//     }
//   });
// });
app.get('/api/find-recipe', (req, res) => {
  try {
    // Parse query parameters
    const selectedIngredients = JSON.parse(req.query.selectedIngredients || '[]');
    const numPeople = parseInt(req.query.numPeople, 10);
    if (!selectedIngredients.length || isNaN(numPeople)) {
      return res.status(400).json({ error: 'Please provide selected ingredients and the number of people.' });
    }

    const selectedIngredientIds = selectedIngredients.map((ing) => ing.product_id);
    // SQL placeholders for the query
    const placeholders = selectedIngredientIds.map(() => '?').join(', ');
    const query = `
      SELECT *
      FROM recipes
      WHERE (product1 IN (${placeholders}) OR product2 IN (${placeholders}) 
        OR product3 IN (${placeholders}) OR product4 IN (${placeholders}) OR product5 IN (${placeholders}))
    `;

    db.all(query, [...selectedIngredientIds, ...selectedIngredientIds, ...selectedIngredientIds], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching recipes: ' + err.message });
      }
      // Filter recipes based on ingredient quantity
      const validRecipes = rows.filter((recipe) => {
        let isValid = true;

        for (let i = 1; i <= 5; i++) {
          const productKey = `product${i}`;
          const quantityKey = `productQuantity${i}`;

          if (recipe[productKey]) {
            const selectedIngredient = selectedIngredients.find((ing) => ing.id === recipe[productKey]);

            if (selectedIngredient) {
              const requiredQuantity = (recipe[quantityKey] * numPeople) / recipe.amountPeople;

              // Check if available quantity is sufficient
              if (selectedIngredient.quantity < requiredQuantity) {
                isValid = false;
                break;
              }
            } else {
              // Ingredient not selected
              isValid = false;
              break;
            }
          }
        }

        return isValid;
      });

      if (validRecipes.length > 0) {
        return res.json({ recipes: validRecipes });
      } else {
        return res.status(404).json({ error: 'No valid recipe found with the selected ingredients and quantities.' });
      }
    });
  } catch (error) {
    return res.status(400).json({ error: 'Invalid request format: ' + error.message });
  }
});

app.get('/api/product-by-barcode', async (req, res) => {
  const { barcode } = req.query;

  if (!barcode) {
    return res.status(400).json({ error: 'Barcode is required.' });
  }

  const JUMBO_API_URL = `https://mobileapi.jumbo.com/v17/search`;
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:102.0) Gecko/20100101 Firefox/102.0',
  };

  try {
    const response = await fetch(`${JUMBO_API_URL}?q=${barcode}`, { headers: HEADERS });

    if (!response.ok) {
      console.error('Error fetching from Jumbo API:', response.statusText);
      return res.status(500).json({ error: `Failed to fetch product details: ${response.statusText}` });
    }

    const data = await response.json();
    const product = data.products?.data?.[0] || null;

    if (!product) {
      return res.status(404).json({ error: 'No product found for the given barcode.' });
    }

    // Extract fields from the response
    const productDetails = {
      id: product.id || null,
      title: product.title || null,
      image: product.image?.[0]?.url || null, // Get the first image URL if available
    };

    res.json(productDetails);
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching product details.' });
  }
});

app.post('/api/sendEmail', (req, res) => {
  console.log("I am called")
  const { recipient, subject, message } = req.body;

  // if (!recipient || !subject || !message) {
  //   return res.status(400).json({ error: 'All fields (recipient, subject, message) are required.' });
  // }
  console.log(recipient);
  console.log(subject);
  console.log(message);
  // Configure Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Change to your email service (e.g., Outlook, SMTP)
    auth: {
      user: "mitchelldevries2001@gmail.com", // Your email address
      pass: "bqrd kgtr ngec ltla", // Your email password or app password
    },
  });

  // Email options
  const mailOptions = {
    from: "mitchelldevries2001@gmail.com",
    to: "mitchelldevries2001@gmail.com",
    subject: "Feedback inventory app",
    text: message,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email.' });
    }
    res.json({ success: true, message: 'Email sent successfully!', info });
  });
});


const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Load the service account key
const serviceAccountKey = require('../app/service-account-key.json');

// Function to create a transport for Nodemailer using Gmail API
async function createTransport() {
  const auth = new google.auth.JWT(
    serviceAccountKey.client_email,
    null,
    serviceAccountKey.private_key,
    ['https://www.googleapis.com/auth/gmail.send'] // Gmail API scope
  );

  await auth.authorize();

  const accessToken = await auth.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'mitchelldevries2001@gmail.com', // Replace with your Gmail address
      accessToken: accessToken.token,
      clientId: serviceAccountKey.client_id,
      clientSecret: serviceAccountKey.private_key_id,
      refreshToken: '', // Not needed for service accounts
    },
  });
}

// Function to send an email
async function sendEmail() {
    console.log("I am called")
  const transporter = await createTransport();

  const mailOptions = {
    from: 'mitchelldevries2001@gmail.com', // Replace with your Gmail address
    to: 'mitchelldevries2001@gmail.com',
    subject: 'Verification Email',
    text: 'This is a test email sent using the Gmail API with a service account.',
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}




// Start the server
app.listen(PORT, '0.0.0.0', () => { // Listen on all network interfaces
  console.log(`Server is running on http://localhost:${PORT}`);
});



