'use client';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, ListGroup, Modal, Button } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import Navbar from '../components/navbar'; // Import the Navbar component

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');

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

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js'); // Dynamically load Bootstrap's JS
  }, []);

  useEffect(() => {
    fetch('http://192.168.1.232:5001/api/products')
      .then((response) => response.json())
      .then((data) => {
        setItems(data);
        setFilteredItems(data);
      })
      .catch((error) => console.error('Error fetching products:', error));
  }, []);

  useEffect(() => {
    setFilteredItems(
      items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, items]);

  const handleAddClick = (item) => {
    setSelectedItem(item);
    setQuantity('');
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setExpiryDate('');
    setLocation('');
    setShowModal(true);
  };

  const addDaysToExpiry = (days) => {
    const today = new Date();
    today.setDate(today.getDate() + days);
    const formattedDate = today.toISOString().slice(0, 10);
    setExpiryDate(formattedDate);
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
        quantity: quantity,
        selectedDate: selectedDate,
        expiryDate: expiryDate,
        location: location,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setShowModal(false);
        alert(`Product "${selectedItem.name}" added to household.`);
      })
      .catch((error) => console.error('Error saving product to household:', error));
  };

  return (
    <>
      <Navbar /> {/* Include Navbar at the top */}
      <Container className="py-3">
        <Row className="mt-3">
          <Col xs={12}>
            <Form.Control
              type="text"
              placeholder="Search for food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <ListGroup>
              {filteredItems.map((item) => (
                <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                  <div className="text-truncate">
                    <strong>{item.name}</strong> - {item.categoryName} - {item.quantityName}
                  </div>
                  <Button variant="success" size="sm" onClick={() => handleAddClick(item)}>
                    <FaPlus />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
        </Row>
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
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
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProduct}>
              Add
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
