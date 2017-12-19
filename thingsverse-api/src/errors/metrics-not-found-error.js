'use strict'

module.exports = class MetricsNotFoundError extends Error {
  constructor (uuid, type, ...params) {
    super(...params)
    this.uuid = uuid
    this.type = type || null
    this.statusCode = 404
    Error.captureStackTrace(this, this.constructor)
    const msg = `Metrics of Agent with uuid ${uuid}`
    this.message = (type)
      ? `${msg} and type ${type} not found`
      : `${msg} not found`
  }
}
