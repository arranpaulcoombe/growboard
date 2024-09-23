const express = require('express');
const https = require('https'); // Import the HTTPS module
const fs = require('fs');       // File system module to read SSL files
const path = require('path');   // Path module for handling file paths
const cors = require('cors');
const axios = require('axios');
const { DBConnection } = require('./sql');

const app = express();
const port = process.env.PORT || 8000; // Use environment variable or default to 8000

// CORS Configuration
app.use(cors({
    origin: '*', // Specify your domain in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// SSL Options
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', '/rpi5server.blenny-pike.ts.net.key')),    // Path to your SSL key
    cert: fs.readFileSync(path.join(__dirname, 'certs', '/rpi5server.blenny-pike.ts.net.crt'))   // Path to your SSL certificate
    // If using Let's Encrypt, use fullchain.pem and privkey.pem
    // Example:
    // key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
    // cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};

// Define your routes
app.get('/active_grows', async (req, res) => {
    const query = "SELECT COUNT (*) FROM growing_milestones WHERE activate = true";
    try {
        const results = await DBConnection(query);
        res.json(results);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

app.get('/drying', async (req, res) => {
    const drying_query = "SELECT COUNT (*) FROM drying_milestones";
    try {
        const results = await DBConnection(drying_query);
        res.json(results);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

app.get('/tent_temp', async (req, res) => {
    const temp_query = "SELECT reading_time, temp AS count FROM grow_tent_TEMP ORDER BY reading_time DESC LIMIT 1";
    const second_query = "SELECT reading_time AS count FROM grow_tent_temp ORDER BY reading_time DESC LIMIT 1";
    try {
        const [tempResults, secondResults] = await Promise.all([
            DBConnection(temp_query),
            DBConnection(second_query)
        ]);
        res.json({ temp: tempResults, reading_time: secondResults });
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

app.get('/tent_humidity', async (req, res) => {
    const humidity_query = "SELECT humidity AS count FROM grow_tent_humidity ORDER BY reading_time DESC LIMIT 1";
    const humidityReadingTimequery = "SELECT reading_time AS count FROM grow_tent_humidity ORDER BY reading_time DESC LIMIT 1";
    try {
        const [humidityResults, secondResults] = await Promise.all([
            DBConnection(humidity_query),
            DBConnection(humidityReadingTimequery)
        ]);
        res.json({ humidity: humidityResults, reading_time: secondResults });
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

app.get('/5dayhumidity', async (req, res) => {
    const fiveDayHumidity_query = `
        SELECT DATE(reading_time) AS day, AVG(humidity) AS count 
        FROM grow_tent_humidity 
        WHERE reading_time >= NOW() - INTERVAL '7 days' 
        GROUP BY DATE(reading_time) 
        ORDER BY day;
    `;
    const fiveDayHumidityReadingTimequery = `
        SELECT DATE(reading_time) AS count, AVG(humidity) AS average_humidity 
        FROM grow_tent_humidity 
        WHERE reading_time >= NOW() - INTERVAL '7 days' 
        GROUP BY DATE(reading_time) 
        ORDER BY count;
    `;
    try {
        const [fiveDayHumidityResults, secondResults] = await Promise.all([
            DBConnection(fiveDayHumidity_query),
            DBConnection(fiveDayHumidityReadingTimequery)
        ]);
        res.json({ humidity: fiveDayHumidityResults, reading_time: secondResults });
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

app.get('/5daytemp', async (req, res) => {
    const fiveDayTemp_query = `
        SELECT DATE(reading_time) AS day, AVG(temp) AS count 
        FROM grow_tent_temp 
        WHERE reading_time >= NOW() - INTERVAL '7 days' 
        GROUP BY DATE(reading_time) 
        ORDER BY day;
    `;
    const fiveDayTempReadingTimequery = `
        SELECT DATE(reading_time) AS count, AVG(temp) AS average_temp 
        FROM grow_tent_temp 
        WHERE reading_time >= NOW() - INTERVAL '7 days' 
        GROUP BY DATE(reading_time) 
        ORDER BY count;
    `;
    try {
        const [fiveDayTempResults, secondResults] = await Promise.all([
            DBConnection(fiveDayTemp_query),
            DBConnection(fiveDayTempReadingTimequery)
        ]);
        res.json({ temp: fiveDayTempResults, reading_time: secondResults });
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

app.get('/5dayco2', async (req, res) => {
    const fiveDayCo2_query = `
        SELECT DATE(reading_time) AS day, AVG(co2) AS count 
        FROM grow_tent_co2 
        WHERE reading_time >= NOW() - INTERVAL '7 days' 
        GROUP BY DATE(reading_time) 
        ORDER BY day;
    `;
    const fiveDayCo2ReadingTimequery = `
        SELECT DATE(reading_time) AS count, AVG(co2) AS average_co2 
        FROM grow_tent_co2 
        WHERE reading_time >= NOW() - INTERVAL '7 days' 
        GROUP BY DATE(reading_time) 
        ORDER BY count;
    `;
    try {
        const [fiveDayCo2Results, secondResults] = await Promise.all([
            DBConnection(fiveDayCo2_query),
            DBConnection(fiveDayCo2ReadingTimequery)
        ]);
        res.json({ Co2: fiveDayCo2Results, reading_time: secondResults });
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

app.get('/tent_co2', async (req, res) => {
    const co2_query = "SELECT co2 AS count FROM grow_tent_co2 ORDER BY reading_time DESC LIMIT 1";
    const co2ReadingTimequery = "SELECT reading_time AS count FROM grow_tent_co2 ORDER BY reading_time DESC LIMIT 1";
    try {
        const [co2Results, secondResults] = await Promise.all([
            DBConnection(co2_query),
            DBConnection(co2ReadingTimequery)
        ]);
        res.json({ co2: co2Results, reading_time: secondResults });
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

app.get('/grow_duration', async (req, res) => {
    const grow_duration_query = `
        SELECT date, CURRENT_DATE - DATE(date) AS count 
        FROM growing_milestones 
        WHERE num_of_plants = '1' 
        ORDER BY count ASC 
        LIMIT 1
    `;
    try {
        const results = await DBConnection(grow_duration_query);
        res.json(results);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).send('Error fetching data');
    }
});

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);

// Start HTTPS server
httpsServer.listen(port, () => {
    console.log(`HTTPS backend listening on port ${port}`);
});

// Optional: Redirect HTTP to HTTPS
// If you want to also handle HTTP requests and redirect them to HTTPS,
// you can create a separate HTTP server.

const http = require('http');
const httpPort = process.env.HTTP_PORT || 80;

const httpApp = express();

// Redirect all HTTP traffic to HTTPS
httpApp.use((req, res, next) => {
    const host = req.headers.host.split(':')[0];
    res.redirect(`https://${host}:${port}${req.url}`);
});

const httpServer = http.createServer(httpApp);

httpServer.listen(httpPort, () => {
    console.log(`HTTP server listening on port ${httpPort} and redirecting to HTTPS`);
});
