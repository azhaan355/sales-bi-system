const db = require('../config/db');

const User = {
  // Find user by email
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const [rows] = await db.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  // Create new user
  create: async (name, email, passwordHash) => {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    return result.insertId;
  }
};

module.exports = User;
