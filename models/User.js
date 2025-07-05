const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatar_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  selected_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
  },
  country_of_origin: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  political_ideology: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  personal_profile: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  last_login_timestamp: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
