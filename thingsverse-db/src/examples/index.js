'use strict'

const db = require('../')
const chalk = require('chalk')

async function run () {
  const config = {
    database: process.env.DB_NAME || 'thingsverse',
    username: process.env.DB_USER || 'thingsverse',
    password: process.env.DB_PASS || 'thingsverse',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres'
  }

  const { Agent, Metric } = await db(config).catch(handleFatalError)
  const agent = await Agent.createOrUpdate({
    uuid: 'yyy',
    name: 'test',
    username: 'test',
    hostname: 'test',
    pid: 1,
    connected: true
  }).catch(handleFatalError)
  console.log('-- agent --')
  console.log(agent)

  const agents = await Agent.findAll().catch(handleFatalError)
  console.log('-- agents --')
  console.log(agents)

  let metrics = await Metric.findByAgentUuid(agent.uuid).catch(handleFatalError)
  console.log('-- metrics --')
  console.log(metrics)

  let metric = await Metric.create(agent.uuid, {
    type: 'memory',
    value: '300'
  }).catch(handleFatalError)
  console.log('-- metric --')
  console.log(metric)

  metric = await Metric.create(agent.uuid, {
    type: 'cpu',
    value: '0.7'
  }).catch(handleFatalError)
  console.log('-- metric --')
  console.log(metric)

  metrics = await Metric.findByAgentUuid(agent.uuid).catch(handleFatalError)
  console.log('-- metrics --')
  console.log(metrics)

  metrics = await Metric.findByTypeAgentUuid('memory', agent.uuid).catch(handleFatalError)
  console.log('-- metrics --')
  console.log(metrics)
}

run()

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}
