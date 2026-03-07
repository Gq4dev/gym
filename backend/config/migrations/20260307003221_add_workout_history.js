/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('workout_history', tbl => {
        tbl.increments('id');
        tbl.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        tbl.integer('routine_id').unsigned().notNullable().references('id').inTable('routines').onDelete('CASCADE');
        tbl.text('routine_snapshot').notNullable(); // Store stringified JSON of the completed workout data
        tbl.timestamp('completed_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('workout_history');
};
