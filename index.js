require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

let currentPrices = {}; // Object to store daily prices
const usdToInrRate = 84; // Fixed conversion rate: 1 USD = 84 INR

// Function to fetch and update prices
async function fetchDailyPrices() {
    const baseUrl = process.env.SMM_BASE_URL;
    const apiUrl = `${baseUrl}?key=${process.env.SMM_API_KEY}&action=services`;

    const usdToInrRate = 84; // Fixed conversion rate

    try {
        const response = await axios.get(apiUrl);
        const services = response.data;

        console.log('Services:', services);

        // Process and update `currentPrices`
        services.forEach((service) => {
            const priceInUsd = parseFloat(service.rate); // Ensure the rate is a number
            const priceInInr = priceInUsd * usdToInrRate; // Convert to INR
            const finalPriceInInr = Math.ceil(priceInInr * 2); // Double and round up

            currentPrices[service.service] = {
                name: service.name,
                priceInUsd: priceInUsd.toFixed(2),
                priceInInr: priceInInr.toFixed(2),
                finalPriceInInr: finalPriceInInr, // Store the doubled price in INR
            };
        });

        console.log('Prices updated:', currentPrices);
        return { success: true, message: 'Prices updated successfully.' };
    } catch (error) {
        console.error('Error fetching prices:', error.message);
        return { success: false, message: `Error fetching prices: ${error.message}` };
    }
}


// API endpoint for cron-job.org to trigger
app.get('/api/update-prices', async (req, res) => {
    try {
        const result = await fetchDailyPrices();
        if (result.success) {
            res.json({ message: 'Prices updated successfully.' });
        } else {
            res.status(500).json({ error: 'Error updating prices.', details: result.message });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get current prices
app.get('/api/get-service-prices', (req, res) => {
    res.json(currentPrices);
});

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
