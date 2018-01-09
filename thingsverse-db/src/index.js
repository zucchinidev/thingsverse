'use strict'
if (process.env.NODE_ENV !== 'production') {
  // expand the stacktrace only in development
  require('longjohn')
}
const defaults = require('defaults')
const setupDatabase = require('./lib/db')
const setupAgentModel = require('./models/agent')
const setupMetricModel = require('./models/metric')
const setupAgent = require('./lib/agent')
const setupMetric = require('./lib/metric')
const { metric, agent } = require('../test/fixtures')

const db = async function (config) {
  config = defaults(config, {
    dialect: 'sqlite',
    pool: {
      max: 10,
      min: 0,
      idle: 10000
    },
    query: {
      raw: true
    }
  })
  const sequelize = setupDatabase(config)
  const AgentModel = setupAgentModel(config)
  const MetricModel = setupMetricModel(config)
  const Agent = setupAgent(AgentModel)
  const Metric = setupMetric(MetricModel, AgentModel)

  AgentModel.hasMany(MetricModel)
  MetricModel.belongsTo(AgentModel)

  await sequelize.authenticate()
  if (config.setup) {
    await sequelize.sync({
      force: true
    })
  }
  return {
    Agent,
    Metric
  }
}
module.exports = {
  db,
  testFixtures: {
    metric,
    agent
  }
}
