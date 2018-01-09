if (process.env.NODE_ENV !== 'production') {
  // expand the stacktrace only in development
  require('longjohn')
}
setTimeout(() => {
  throw new Error('boom')
}, 2000)
