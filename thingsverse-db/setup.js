'use strict'
const debug = require('debug')('thingsverse:db:setup')

const db = require('./')

async function setup () {
  const config = {
    database: process.env.DB_NAME || 'thingsverse',
    username: process.env.DB_USER || 'thingsverse',
    password: process.env.DB_PASS || 'thingsverse',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s),
    setup: true
  }
  await db(config).catch(handleFatalError)

  console.log('Connection has been established successfully!')
  process.exit(0)
}

function handleFatalError (err) {
  console.error(err.message)
  console.error(err.stack)
  process.exit(1)
}

setup()
