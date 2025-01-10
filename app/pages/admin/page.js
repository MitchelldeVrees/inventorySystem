'use client';
import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form ,Row, Col} from 'react-bootstrap';
import { AiFillEdit, AiFillDelete } from 'react-icons/ai';
import Navbar from '../components/navbar'; // Import the Navbar component

export default function InventoryTablePage() {
  const [inventory, setInventory] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false); // New add modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [newName, setNewName] = useState(''); // New product name state
  const [newCategoryId, setNewCategoryId] = useState(''); // New product category ID state
  const [newQuantityId, setNewQuantityId] = useState(''); // New product quantity ID state

  const [editedCategory, setEditedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [category, setCategory] = useState([])
  const [quantity, setQuantity]=useState([])
  const [editedCategoryId, setEditedCategoryId] = useState('');
  const [editedQuantityId, setEditedQuantityId] = useState('');
  const [newSynoniem, setNewSynoniem] = useState(''); // State to manage synoniem input for the Add modal
  const [editedSynoniem, setEditedSynoniem] = useState('');

  // Function to fetch inventory data
  const fetchData = () => {
    fetch('/api/products')
      .then((response) => response.json())
      .then((data) => setInventory(data))
      .catch((error) => console.error('Error fetching inventory:', error));

      fetch('/api/quantity')
      .then((response) => response.json())
      .then((data) => setQuantity(data))
      .catch((error) => console.error('Error fetching inventory:', error));

      fetch('/api/category')
      .then((response) => response.json())
      .then((data) => setCategory(data))
      .catch((error) => console.error('Error fetching inventory:', error));

  };
  

  // Fetch inventory data initially
  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditedName(item.name);
    setEditedCategoryId(item.categoryId); // Assuming `categoryId` is the ID stored for category
    setEditedQuantityId(item.quantityId); // Assuming `quantityId` is the ID stored for quantity
    setEditedSynoniem(item.synoniem || ''); // Initialize with existing synoniem or empty
    setShowEditModal(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleCloseEditModal = () => setShowEditModal(false);
  const handleCloseAddModal = () => setShowAddModal(false); // Close add modal
  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const handleDeleteItem = async () => {
    try {
      const response = await fetch(`/api/products/${selectedItem.id}`, {
        method: 'DELETE',
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        alert(result.error); // Show error message if deletion is not allowed
      } else {
        fetchData(); // Refresh data if deletion is successful
        setShowDeleteModal(false); // Close delete modal
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };
  

  // Filtered and sorted inventory list
  const filteredInventory = inventory
  .filter((item) => {
    const searchTerms = searchTerm.toLowerCase().split(' '); // Split terms for multi-word search
    return searchTerms.every((term) => 
      // Check name and synoniem fields
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.synoniem && item.synoniem.toLowerCase().includes(term))
    );
  })
  .sort((a, b) => {
    if (sortConfig.key) {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      return a[sortConfig.key] > b[sortConfig.key]
        ? direction
        : a[sortConfig.key] < b[sortConfig.key]
        ? -direction
        : 0;
    }
    return 0;
  });

  const handleAddProduct = () => {
    fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newName,
        categoryId: newCategoryId,
        quantityId: newQuantityId,
        synoniem: newSynoniem || null, // Send synoniem or null
      }),
    })
      .then((response) => response.json())
      .then(() => {
        fetchData(); // Refresh data
        setShowAddModal(false); // Close modal
        setNewName('');
        setNewCategoryId('');
        setNewQuantityId('');
        setNewSynoniem(''); // Clear synoniem
      })
      .catch((error) => console.error('Error adding new product:', error));
  };
  
    
  const handleSaveChanges = () => {
    fetch(`/api/products/${selectedItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: editedName,
        categoryId: editedCategoryId,
        quantityId: editedQuantityId,
        synoniem: editedSynoniem || null, // Send synoniem or null
      }),
    })
      .then((response) => response.json())
      .then(() => {
        fetchData(); // Refresh data
        setShowEditModal(false); // Close modal
      })
      .catch((error) => console.error('Error updating product:', error));
  };
  
    

  // Function to handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <>
          <Navbar /> {/* Include Navbar at the top */}

    <Container className="mt-3">
    <h2 className="text-center mb-3">Products Table</h2>
    <Row className="align-items-center mb-3">
  <Col xs={12} sm={6}>
    <Form.Control
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="mb-2 mb-sm-0"
    />
  </Col>
  <Col xs={12} sm={6} className="text-sm-end">
    <Button variant="success" onClick={() => setShowAddModal(true)}>
      Add New Product
    </Button>
  </Col>
</Row>


<div className="table-responsive">
<Table striped bordered hover>
  <thead>
    <tr>
      <th onClick={() => handleSort('name')}>
        Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
      <th onClick={() => handleSort('category')}>
        Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
      <th onClick={() => handleSort('quantity')}>
        Quantity {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {filteredInventory.map((item) => {
      // Find the category and quantity names based on the IDs
      const categoryName = category.find((cat) => cat.id === item.categoryId)?.name || 'Unknown';
      const quantityName = quantity.find((qty) => qty.id === item.quantityId)?.name || 'Unknown';

      return (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>{categoryName}</td>
          <td>{quantityName}</td>
          <td>
            <div className="d-flex justify-content-between">
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => handleEditClick(item)}
              >
                <AiFillEdit />
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDeleteClick(item)}
              >
                <AiFillDelete />
              </Button>
            </div>
          </td>
        </tr>
      );
    })}
  </tbody>
</Table>
</div>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
  <Modal.Header closeButton>
    <Modal.Title>Edit Product</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedItem && (
      <Form>
        <Form.Group controlId="formName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
          />
        </Form.Group>
        
        <Form.Group controlId="formCategory" className="mt-3">
          <Form.Label>Category</Form.Label>
          <Form.Control
            as="select"
            value={editedCategoryId}
            onChange={(e) => setEditedCategoryId(e.target.value)}
          >
            <option value="">Select a category</option>
            {category.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="formQuantity" className="mt-3">
          <Form.Label>Quantity</Form.Label>
          <Form.Control
            as="select"
            value={editedQuantityId}
            onChange={(e) => setEditedQuantityId(e.target.value)}
          >
            <option value="">Select a quantity</option>
            {quantity.map((qty) => (
              <option key={qty.id} value={qty.id}>
                {qty.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        {/* Synoniem Field */}
        <Form.Group controlId="formSynoniem" className="mt-3">
          <Form.Label>Synoniem(Optional) synoniem1, synoniem2, synoniem3</Form.Label>
          <Form.Control
            type="text"
            value={editedSynoniem}
            onChange={(e) => setEditedSynoniem(e.target.value)}
          />
        </Form.Group>
      </Form>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleCloseEditModal}>
      Close
    </Button>
    <Button variant="primary" onClick={handleSaveChanges}>
      Save Changes
    </Button>
  </Modal.Footer>
</Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this product?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteItem}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAddModal} onHide={handleCloseAddModal}>
  <Modal.Header closeButton>
    <Modal.Title>Add New Product</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group controlId="formName">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </Form.Group>

      <Form.Group controlId="formCategory" className="mt-3">
        <Form.Label>Category</Form.Label>
        <Form.Control
          as="select"
          value={newCategoryId}
          onChange={(e) => setNewCategoryId(e.target.value)}
        >
          <option value="">Select a category</option>
          {category.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      <Form.Group controlId="formQuantity" className="mt-3">
        <Form.Label>Quantity</Form.Label>
        <Form.Control
          as="select"
          value={newQuantityId}
          onChange={(e) => setNewQuantityId(e.target.value)}
        >
          <option value="">Select a quantity</option>
          {quantity.map((qty) => (
            <option key={qty.id} value={qty.id}>
              {qty.name}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      {/* Synoniem Field */}
      <Form.Group controlId="formSynoniem" className="mt-3">
        <Form.Label>Synoniem (Optional)</Form.Label>
        <Form.Control
          type="text"
          value={newSynoniem}
          onChange={(e) => setNewSynoniem(e.target.value)}
        />
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleCloseAddModal}>
      Close
    </Button>
    <Button variant="primary" onClick={handleAddProduct}>
      Add Product
    </Button>
  </Modal.Footer>
</Modal>

    </Container>
    </>
  );
}
