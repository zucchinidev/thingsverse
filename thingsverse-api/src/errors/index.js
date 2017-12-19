const AgentNotFoundError = require('./agent-not-found-error')
const MetricsNotFoundError = require('./metrics-not-found-error')
const NotAuthenticatedError = require('./not-authenticated-error')
const NotAuthorizedError = require('./not-authorized-error')
module.exports = {
  AgentNotFoundError,
  MetricsNotFoundError,
  NotAuthenticatedError,
  NotAuthorizedError
}
