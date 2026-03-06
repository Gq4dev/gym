require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: __dirname + '/dev.sqlite3'
    },
    useNullAsDefault: true
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: __dirname + '/migrations'
    },
    seeds: {
      directory: __dirname + '/seeds'
    }
  }
};
