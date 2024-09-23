const { Client } = require('pg');

async function DBConnection(sqlQuery) {
    const client = new Client({
        user: 'postgres',
        password: 'Cupra2024!',
        host: '100.94.249.72',
        port: '5432',
        database: 'postgres',
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL database');

        const result = await client.query(sqlQuery);
        const results = result.rows.map(row => row.count);
        console.log(results);

        await client.end();
        return results;
    } catch (err) {
        console.error('Error connecting to PostgreSQL database or executing query', err);
        await client.end();
        throw err;
    }
}

module.exports = { DBConnection };
