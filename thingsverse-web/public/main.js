'use strict'
/* global io */
const socket = io()

socket.on('agent/message', payload => {
  console.log('agent/message', payload)
})

socket.on('agent/connected', payload => {
  console.log('agent/connected', payload)
})

socket.on('agent/disconnectedḉ', payload => {
  console.log('agent/disconnected', payload)
})

setTimeout(() => {
  socket.emit('agent/message', 'hello server!!!')
}, 5000)
