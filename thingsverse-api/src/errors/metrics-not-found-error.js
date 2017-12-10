'use strict'

module.exports = class MetricsNotFoundError extends Error {
  constructor (uuid, type, ...params) {
    super(...params)
    this.uuid = uuid
    this.type = type || null
    this.code = 404
    Error.captureStackTrace(this, MetricsNotFoundError)
    this.message = (type)
      ? `Metrics of Agent with uuid ${uuid} and type${type} not found `
      : `Agent with uuid ${uuid} not found`
  }
}
