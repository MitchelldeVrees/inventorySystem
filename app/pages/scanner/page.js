"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import Webcam from "react-webcam";

export default function Scanner() {
    const [barcode, setBarcode] = useState(null);
    const [productData, setProductData] = useState(null);
    const webcamRef = useRef(null);
    const [error, setError] = useState(null);
    const [isCameraSupported, setIsCameraSupported] = useState(true);

    useEffect(() => {
        // Check if the browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setIsCameraSupported(false);
        }
    }, []);

    const scanBarcode = () => {
        const codeReader = new BrowserMultiFormatReader();
        try {
            const videoElement = webcamRef.current.video;

            codeReader.decodeFromVideoDevice(null, videoElement, (result, err) => {
                if (result) {
                    setBarcode(result.text);
                    fetchProductDetails(result.text);
                    codeReader.reset(); // Stop the scanner after successfully scanning
                }
                if (err && !(err instanceof Error)) {
                    console.warn("Scanning failed", err); // Log non-critical errors
                }
            });
        } catch (err) {
            console.error("Error initializing barcode scanner:", err);
            setError("Failed to initialize the scanner. Please try again.");
        }
    };

    const fetchProductDetails = async (barcode) => {
        try {
            const response = await fetch(`http://192.168.1.232:5001/api/product-by-barcode?barcode=${barcode}`);
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    setProductData(data);
                } else {
                    setError("No product found for the given barcode.");
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Failed to fetch product details.");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("An error occurred while fetching product details.");
        }
    };

    if (!isCameraSupported) {
        return <p>Your browser does not support camera access. Please use a modern browser.</p>;
    }

    return (
        <div style={{ textAlign: "center" }}>
            <h1>Barcode Scanner</h1>
            <Webcam ref={webcamRef} style={{ width: "100%", maxWidth: 400 }} />
            <button onClick={scanBarcode} style={{ marginTop: 20 }}>
                Scan Barcode
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {barcode && <p>Scanned Barcode: {barcode}</p>}
            {productData && (
            <div>
                <h1>{productData.title}</h1>
                <img src={productData.image} alt={productData.title} />
            </div>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}
