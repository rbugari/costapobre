const { Sequelize } = require('sequelize');
require('dotenv').config({ path: __dirname + '/../.env' });

const env = process.env.NODE_ENV || 'development';

const dbConfig = {
  development: {
    database: process.env.DB_NAME_DEV,
    username: process.env.DB_USER_DEV,
    password: process.env.DB_PASSWORD_DEV,
    host: process.env.DB_HOST_DEV,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    database: process.env.DB_NAME_PROD,
    username: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    host: process.env.DB_HOST_PROD,
    dialect: 'mysql',
    logging: false,
  },
};

const sequelize = new Sequelize(
  dbConfig[env].database,
  dbConfig[env].username,
  dbConfig[env].password,
  {
    host: dbConfig[env].host,
    dialect: dbConfig[env].dialect,
    logging: dbConfig[env].logging,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL Connected to ${env} database...`);
    console.log('All models synchronized with database.');
  } catch (error) {
    console.error('Unable to connect to the database or synchronize models:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };