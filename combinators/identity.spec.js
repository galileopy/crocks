const test = require('tape')

const isFunction = require('../predicates/isFunction')

const identity = require('./identity')

test('identity (I combinator)', t => {
  const x = 'somehting'

  t.ok(isFunction(identity), 'is a function')
  t.equal(identity(x), x, 'returns the passed argument')

  t.end()
})
