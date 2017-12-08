'use strict'

const test = require('ava')
const { parsePayload } = require('../')

test('payload#parsePayload', t => {
  let result = parsePayload('{"a":"a"}')
  t.deepEqual(result, {a: 'a'}, 'Should be a valid object')
  const buffer = Buffer.from('{"a":"a"}')
  result = parsePayload(buffer)
  t.deepEqual(result, {a: 'a'}, 'Should be a valid object')
  result = parsePayload()
  t.is(result, null, 'Should a null object')
})
