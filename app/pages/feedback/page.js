"use client";

import { useState } from "react";
import Navbar from "../components/navbar";

export default function Feedback() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://192.168.1.232:5001/api/sendEmail", { // Updated to match the route
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }), // Ensure the body matches expected server fields
      });

      const data = await res.json();
      setResponse(data.message);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Failed to send email.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h1 className="text-center mb-4">Feedback Form</h1>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <form onSubmit={handleSubmit} className="p-4 border rounded bg-light shadow-sm">
              <div className="mb-3">
                <label htmlFor="message" className="form-label">
                  Message:
                </label>
                <textarea
                  id="message"
                  className="form-control"
                  rows="5"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Submit
              </button>
            </form>
            {response && <p className="text-center mt-3 text-success">{response}</p>}
          </div>
        </div>
      </div>
    </>
  );
}