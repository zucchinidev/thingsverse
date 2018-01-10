'use strict'

module.exports = class NotAuthenticatedError extends Error {
  constructor (uuid, ...params) {
    super(...params)
    this.uuid = uuid
    this.status = 401
    Error.captureStackTrace(this, this.constructor)
    this.message = `User is not authenticated`
  }
}
