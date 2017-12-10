'use strict'

module.exports = class NotAuthenticatedError extends Error {
  constructor (uuid, ...params) {
    super(...params)
    this.uuid = uuid
    this.code = 401
    Error.captureStackTrace(this, NotAuthenticatedError)
    this.message = `User is not authenticated`
  }
}
