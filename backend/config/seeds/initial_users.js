/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  const hash = await bcrypt.hash('adminpass', 10);
  // Inserts seed entries
  await knex('users').insert([
    {username: 'admin', password: hash, role: 'admin'}
  ]);
};
