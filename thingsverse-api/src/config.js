'use strict'
const debug = require('debug')('thingsverse:api:db')

module.exports = {
  db: {
    database: process.env.DB_NAME || 'thingsverse',
    username: process.env.DB_USER || 'thingsverse',
    password: process.env.DB_PASS || 'thingsverse',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s),
    setup: true
  }
}