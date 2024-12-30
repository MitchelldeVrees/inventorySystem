'use client';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Form, Modal, Button, ListGroup, Card } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import Navbar from '../components/navbar'; // Import the Navbar component

export default function HouseholdPage() {
  const [householdProducts, setHouseholdProducts] = useState([]);
  const [filters, setFilters] = useState({
    productName: '',
    quantity: '',
    daysTillExpiry: '',
    locationName: '',
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');
  const [reduceQuantity, setReduceQuantity] = useState(0);
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // Today's date
  const [outputDate, setLocalOutputDate] = useState(selectedItem?.output_date || "");

  const locationOptions = [
    { id: 1, name: 'Vriezer' },
    { id: 2, name: 'Voorraadkast 1' },
    { id: 3, name: 'Voorraadkast 2 (Drinken)' },
    { id: 4, name: 'Voorraadkast 3 (Potjes)' },
    { id: 5, name: 'Bakkast/Mitchell kast' },
    { id: 6, name: 'Koelkast' },
    { id: 7, name: 'Mini vriezer' },
    { id: 8, name: 'Verboden kast' },
    { id: 9, name: 'Keukenkast' },
    { id: 10, name: 'Versgoed' },
    { id: 11, name: 'Kar' },
    { id: 12, name: 'Cleaning' },
  ];

  // Fetch inventory items
  useEffect(() => {
    fetch('http://192.168.1.232:5001/api/products')
      .then((response) => response.json())
      .then((data) => setItems(data))
      .catch((error) => console.error('Error fetching products:', error));
  }, []);

  // Fetch household products
  useEffect(() => {
    fetch('http://192.168.1.232:5001/api/household-products')
      .then((response) => response.json())
      .then((data) => setHouseholdProducts(data))
      .catch((error) => console.error('Error fetching household products:', error));
  }, []);

  // Filter inventory items
  useEffect(() => {
    setFilteredProducts(
      items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.synoniem && item.synoniem.toLowerCase().includes(searchTerm.toLowerCase())) // Check for synoniem
      )
    );
  }, [searchTerm, items]);

  const addDaysToExpiry = (days) => {
    const today = new Date();
    today.setDate(today.getDate() + days);
    const formattedDate = today.toISOString().slice(0, 10);
    setExpiryDate(formattedDate);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const filteredHouseholdProducts = householdProducts
  .filter((product) => {
    return (
      (!filters.productName ||
        product.productName.toLowerCase().includes(filters.productName.toLowerCase()) ||
        (product.synoniem && product.synoniem.toLowerCase().includes(filters.productName.toLowerCase()))) && // Include synoniem
      (!filters.quantity || product.quantity.toString().includes(filters.quantity)) &&
      (!filters.daysTillExpiry || product.daysTillExpiry.toString().includes(filters.daysTillExpiry)) &&
      (!filters.locationName || product.locationName.toLowerCase().includes(filters.locationName.toLowerCase()))
    );
  })
  .sort((a, b) => a.daysTillExpiry - b.daysTillExpiry);

  const handleAddClick = (item) => {
    setSelectedItem(item);
    setQuantity('');
    setExpiryDate('');
    setLocation('');
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setShowAddProductModal(false); // Close the search modal
    setShowDetailsModal(true); // Open the add details modal
  };

  const handleSaveProduct = () => {
    if (!quantity || !expiryDate || !location) {
      alert('Please fill all fields');
      return;
    }

    fetch('http://192.168.1.232:5001/api/household-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: selectedItem.id,
        quantity,
        expiryDate,
        selectedDate: selectedDate,
        location,
      }),
    })
      .then((response) => response.json())
      .then((newProduct) => {
        setHouseholdProducts((prevProducts) => [...prevProducts, newProduct]);
        setShowDetailsModal(false); // Close the modal
      })
      .catch((error) => console.error('Error adding product:', error));
  };

  const handleEditClick = (product) => {
    const householdItem = householdProducts.find((item) => item.id === product.id);
    if (householdItem) {
      setSelectedItem(householdItem);
      setCurrentQuantity(householdItem.quantity);
      setReduceQuantity(0);
      setShowEditModal(true);
    } else {
      alert('Household item not found');
    }
  };


  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setLocalOutputDate(newDate);
    setOutputDate(newDate); // Update the parent state or handle the date change
  };

  const handleReduceQuantity = () => {
    if (reduceQuantity <= 0 || reduceQuantity > currentQuantity) {
      alert('Invalid quantity to reduce');
      return;
    }
    fetch('http://192.168.1.232:5001/api/household-products/reduce-quantity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: selectedItem.product_id,
        reduceQuantity,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
        } else {
          setHouseholdProducts((prevProducts) =>
            prevProducts.map((product) =>
              product.id === selectedItem.id
                ? { ...product, quantity: product.quantity - reduceQuantity }
                : product
            )
          );
          setCurrentQuantity((prev) => prev - reduceQuantity);
          setReduceQuantity(0);
          setShowEditModal(false);
        }
      })
      .catch((error) => console.error('Error reducing quantity:', error));
  };

  return (
    <>
      <Navbar />
      <Container className="py-3">
        <Row>
          <Col xs={12} className="d-flex justify-content-between align-items-center">
            <h2>Inventory</h2>
            <Button variant="primary" onClick={() => setShowAddProductModal(true)}>
              + Product
            </Button>
          </Col>
        </Row>
        <Row>
          <Col xs={12} className="mb-3">
            <Form.Control
              type="text"
              placeholder="Filter by Product Name"
              name="productName"
              value={filters.productName}
              onChange={handleFilterChange}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            {/* Render as cards on mobile */}
            <div className="d-md-none">
              {filteredHouseholdProducts.map((product) => (
                <Card className="mb-3" key={product.id}>
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>{product.productName}</div>
                    <div>{product.ActualQuantity}</div>
                    <div>{product.daysTillExpiry} days</div>
                    <div>{product.locationName}</div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEditClick(product)}
                    >
                      Edit
                    </Button>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* Render as table on larger screens */}
            <div className="d-none d-md-block">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Days Till Expiry</th>
                    <th>Location</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
  {filteredHouseholdProducts.map((product) => (
    <tr
      key={product.id}
      className={
        Number(product.daysTillExpiry) < 3
          ? 'bg-warning'
          : ''
      }
    >
      <td>{product.productName}</td>
      <td>{product.ActualQuantity}</td>
      <td>{product.daysTillExpiry} days</td>
      <td>{product.locationName}</td>
      <td>
        <Button size="sm" onClick={() => handleEditClick(product)}>
          Edit
        </Button>
      </td>
    </tr>
  ))}
</tbody>

              </Table>
            </div>
          </Col>
        </Row>

        {/* Modal for Adding Product */}
        <Modal show={showAddProductModal} onHide={() => setShowAddProductModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Search and Add Product</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-overflow">
          <Form.Control
              type="text"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />
            <ListGroup>
              {filteredProducts.map((item) => (
                <ListGroup.Item
                  key={item.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>{item.name}</div>
                  <Button variant="success" size="sm" onClick={() => handleAddClick(item)}>
                    <FaPlus />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Modal.Body>
        </Modal>

        {/* Modal for Adding Product Details */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Add {selectedItem?.name}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Product</Form.Label>
        <h5>{selectedItem?.name}</h5>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Hoeveelheid in {selectedItem?.quantityName}:</Form.Label>
        <Form.Control
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Date of Entry</Form.Label>
        <Form.Control
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Expiry Date</Form.Label>
        <Form.Control
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
        <div className="mt-2 d-flex justify-content-between">
          <Button variant="outline-primary" size="sm" onClick={() => addDaysToExpiry(7)}>+7</Button>
          <Button variant="outline-primary" size="sm" onClick={() => addDaysToExpiry(14)}>+14</Button>
          <Button variant="outline-primary" size="sm" onClick={() => addDaysToExpiry(30)}>+30</Button>
          <Button variant="outline-primary" size="sm" onClick={() => addDaysToExpiry(90)}>+90</Button>
          <Button variant="outline-primary" size="sm" onClick={() => addDaysToExpiry(180)}>+180</Button>
          <Button variant="outline-primary" size="sm" onClick={() => addDaysToExpiry(365)}>+365</Button>
        </div>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Location</Form.Label>
        <Form.Select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">Select Location</option>
          {locationOptions.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSaveProduct}>
      Add
    </Button>
  </Modal.Footer>
</Modal>


        {/* Modal for Editing Quantity */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Edit Product</Modal.Title>
  </Modal.Header>
  <Modal.Body>
      {selectedItem && (
        <>
          <Row className="mb-3">
            <Col xs={6}>
              <strong>Product Name:</strong>
            </Col>
            <Col xs={6}>{selectedItem.productName}</Col>
          </Row>
          <Row className="mb-3">
            <Col xs={6}>
              <strong>Actual Quantity:</strong>
            </Col>
            <Col xs={6}>{selectedItem.ActualQuantity}</Col>
          </Row>
          <Row className="mb-3">
            <Col xs={6}>
              <strong>Output Date:</strong>
            </Col>
            <Col xs={6}>
              <Form.Control
                type="date"
                value={selectedItem.outputDate}
                onChange={handleDateChange}
              />
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Reduce Quantity</Form.Label>
            <Form.Control
              type="number"
              onChange={(e) => setReduceQuantity(Number(e.target.value))}
            />
          </Form.Group>
        </>
      )}
    </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
      Cancel
    </Button>
    <Button
      variant="primary"
      onClick={handleReduceQuantity}
      disabled={reduceQuantity <= 0 || reduceQuantity > currentQuantity}
    >
      Reduce Quantity
    </Button>
  </Modal.Footer>
</Modal>
      </Container>
    </>
  );
}