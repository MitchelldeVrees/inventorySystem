'use client';

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Button, Form, Alert, Spinner, Card, Accordion, Modal } from 'react-bootstrap';
import jsPDF from 'jspdf';
import OpenAI from "openai";

export default function Recipes() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [mealType, setMealType] = useState('');
  const [numPeople, setNumPeople] = useState('');
  const [proteinType, setProteinType] = useState('');
  const [source, setSource] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://192.168.1.232:5001/api/household-products');
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid data format');
        setIngredients(data);
      } catch (err) {
        console.error('Error fetching ingredients:', err);
        setIngredients([]); // Fallback to an empty array
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, []);
  

  const toggleIngredient = (id) => {
    setSelectedIngredients((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((ingredientId) => ingredientId !== id)
        : [...prevSelected, id]
    );
  };

  const handleRecipeCreation = async () => {
    if (!mealType || !numPeople || !proteinType || !source) {
      setShowAlert(true);
      return;
    }

    if (source === 'Database') {
      // Prepare data for backend call
      const selectedIngredientsData = ingredients.filter((ingredient) => selectedIngredients.includes(ingredient.id));
      const requestData = {
        numPeople: parseInt(numPeople),
        selectedIngredients: selectedIngredientsData.map((ingredient) => ({
          id: ingredient.id,
          quantity: ingredient.quantity,
        })),
      };

      const queryString = `selectedIngredients=${encodeURIComponent(
        JSON.stringify(requestData.selectedIngredients)
      )}&numPeople=${requestData.numPeople}`;

      try {
        const response = await fetch(`http://192.168.1.232:5001/api/find-recipe?${queryString}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRecipes((prevRecipes) => [...prevRecipes, { title: `Recipe ${prevRecipes.length + 1}`, content: data.recipe, ingredients: requestData.selectedIngredients }]);
      } catch (err) {
        console.error('Error finding recipe:', err);
      }
    } else {
      try {
        const selectedIngredientNames = ingredients
          .filter((ingredient) => selectedIngredients.includes(ingredient.id))
          .map((ingredient) => ingredient.productName);

        const prompt = `You are a chefcook. Generate a ${mealType} recipe for ${numPeople} people using ${proteinType} protein and the following ingredients: ${selectedIngredientNames.join(
          ', '
        )}`;

        const openai = new OpenAI({
          apiKey: "YOUR_OPENAI_API_KEY",
          dangerouslyAllowBrowser: true
        });

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-16k",
          messages: [
            {
              role: "system",
              content: prompt,
            },
          ],
          temperature: 1,
          max_tokens: 2048,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });

        const recipeContent = response.choices[0].message.content;
        setRecipes((prevRecipes) => [...prevRecipes, { title: `Recipe ${prevRecipes.length + 1}`, content: recipeContent, ingredients: selectedIngredientNames }]);
      } catch (err) {
        console.error('Error creating recipe:', err);
      }
    }
  };

  const downloadRecipeAsPDF = (recipeContent) => {
    const doc = new jsPDF();
    doc.text(recipeContent, 10, 10);
    doc.save('recipe.pdf');
  };

  const handleModalOpen = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  return (
    <Container>
      <h1 className="mt-4">Create a Recipe</h1>

      <Row className="mt-3">
        <Col md={4} className="border-end">
          {showAlert && <Alert variant="danger">Please fill in all the fields!</Alert>}

          <div className="mb-4">
            <h4>Select Ingredients</h4>
            <Button onClick={handleModalOpen}>Select Ingredients</Button>
            {loading && <Spinner animation="border" className="ms-3" />}
          </div>

          <Form>
            <h4>Meal Type</h4>
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
              <Form.Check
                key={type}
                type="radio"
                name="mealType"
                label={type}
                onChange={() => setMealType(type)}
              />
            ))}

            <Form.Group controlId="numPeople" className="mt-3">
              <Form.Label>Number of People</Form.Label>
              <Form.Control
                type="number"
                value={numPeople}
                onChange={(e) => setNumPeople(e.target.value)}
                placeholder="Enter number of people"
              />
            </Form.Group>

            <h4 className="mt-3">Protein Type</h4>
            {['Fish', 'Flesh', 'Vegan'].map((type) => (
              <Form.Check
                key={type}
                type="radio"
                name="proteinType"
                label={type}
                onChange={() => setProteinType(type)}
              />
            ))}

            <h4 className="mt-3">Source</h4>
            {['Online', 'Database'].map((src) => (
              <Form.Check
                key={src}
                type="radio"
                name="source"
                label={src}
                onChange={() => setSource(src)}
              />
            ))}

            <Button className="mt-4" onClick={handleRecipeCreation} variant="primary">
              Create Recipe
            </Button>
          </Form>
        </Col>

        <Col md={8} className="ps-4">
          <h3>Generated Recipes</h3>
          {recipes.length === 0 ? (
            <Alert variant="info" className="mt-4">No recipes generated yet.</Alert>
          ) : (
            <Accordion className="mt-4">
              {recipes.map((recipe, index) => (
                <Accordion.Item eventKey={index.toString()} key={index}>
                  <Accordion.Header>{recipe.title} - Ingredients: {recipe.ingredients.length} (You have: {recipe.ingredients.filter(ingredient => selectedIngredients.includes(ingredients.find(ing => ing.productName === ingredient)?.id)).length})</Accordion.Header>
                  <Accordion.Body>
                    <h5>{recipe.title}</h5>
                    <p>{recipe.content}</p>
                    <Button onClick={() => downloadRecipeAsPDF(recipe.content)}>Download as PDF</Button>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Ingredients</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <Spinner animation="border" />
          ) : ingredients.length === 0 ? (
            <Alert variant="info">No ingredients available.</Alert>
          ) : (
            ingredients.map((ingredient) => (
              <Card
                key={ingredient.id}
                className={`mb-2 ${selectedIngredients.includes(ingredient.id) ? 'bg-success text-white' : ''}`}
                onClick={() => toggleIngredient(ingredient.id)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Body>
                  <Card.Title>{ingredient.productName}</Card.Title>
                  <Card.Text>
                    Quantity: {ingredient.quantity}, Expiry: {ingredient.daysTillExpiry} days
                  </Card.Text>
                </Card.Body>
              </Card>
            ))
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleModalClose}>
            Save Selection
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
