'use strict'

module.exports = class NotAuthorizedError extends Error {
  constructor (...params) {
    super(...params)
    this.code = 401
    Error.captureStackTrace(this, NotAuthorizedError)
    this.message = `This user is not authorized to access the requested content`
  }
}
