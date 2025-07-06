const express = require('express');
const { connectDB, sequelize } = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Sync Sequelize models
sequelize.sync();

// Init Middleware
app.use(express.static('public'));
app.use(express.json({ extended: false }));
app.use(cors());

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/history', require('./routes/history'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/upload', require('./routes/upload'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor backend listo para operar en el puerto ${PORT}`));
