/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', tbl => {
      tbl.increments('id');
      tbl.string('username').notNullable().unique();
      tbl.string('password').notNullable();
      tbl.string('role').notNullable().defaultTo('user'); // 'admin' or 'user'
      tbl.timestamps(true, true);
    })
    .createTable('categories', tbl => {
      tbl.increments('id');
      tbl.string('name').notNullable().unique();
      tbl.timestamps(true, true);
    })
    .createTable('exercises', tbl => {
      tbl.increments('id');
      tbl.string('name').notNullable();
      tbl.text('description');
      tbl.integer('category_id').unsigned().references('id').inTable('categories').onDelete('CASCADE');
      tbl.timestamps(true, true);
    })
    .createTable('routines', tbl => {
      tbl.increments('id');
      tbl.string('title').notNullable();
      tbl.text('notes');
      tbl.timestamps(true, true);
    })
    .createTable('routine_exercises', tbl => {
      tbl.increments('id');
      tbl.integer('routine_id').unsigned().notNullable().references('id').inTable('routines').onDelete('CASCADE');
      tbl.integer('exercise_id').unsigned().notNullable().references('id').inTable('exercises').onDelete('CASCADE');
      tbl.integer('reps');
      tbl.integer('sets');
      tbl.integer('duration'); // seconds
      tbl.timestamps(true, true);
    })
    .createTable('assignments', tbl => {
      tbl.increments('id');
      tbl.integer('routine_id').unsigned().notNullable().references('id').inTable('routines').onDelete('CASCADE');
      tbl.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      tbl.date('assigned_at').defaultTo(knex.fn.now());
      tbl.date('due_date');
      tbl.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('assignments')
    .dropTableIfExists('routine_exercises')
    .dropTableIfExists('routines')
    .dropTableIfExists('exercises')
    .dropTableIfExists('categories')
    .dropTableIfExists('users');
};
