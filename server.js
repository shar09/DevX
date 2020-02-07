const express = require('express');
const connectDb = require('./config/db');

const app = express();

//Connect Database
connectDb();

app.get("/", (req, res) => res.send('API Running'));

const PORT = process.env.port || 5000;

app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));