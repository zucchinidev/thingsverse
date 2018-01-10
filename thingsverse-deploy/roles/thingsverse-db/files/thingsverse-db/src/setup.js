'use strict'
const debug = require('debug')('thingsverse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')
const miniminst = require('minimist')
const { db } = require('./')
const prompt = inquirer.createPromptModule()

/**
 * Setup database: node setup.js -- --yes
 */
async function setup () {
  const args = miniminst(process.argv)
  const forceDestroy = args.yes
  if (!forceDestroy) {
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'setup',
        message: 'This will destroy your database, are you sure?'
      }
    ])
    if (!answer.setup) {
      return console.log('Nothing happened :)')
    }
  }
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
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

setup()
