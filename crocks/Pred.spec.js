const test = require('tape')
const sinon = require('sinon')
const helpers = require('../test/helpers')

const bindFunc = helpers.bindFunc
const noop = helpers.noop

const isFunction = require('../predicates/isFunction')
const isObject = require('../predicates/isObject')

const composeB = require('../combinators/composeB')
const constant = require('../combinators/constant')
const identity = require('../combinators/identity')

const Pred = require('./Pred')

test('Pred', t => {
  const p = bindFunc(Pred)

  t.ok(isFunction(Pred), 'is a function')

  t.ok(isFunction(Pred.type), 'provides a type function')
  t.ok(isFunction(Pred.empty), 'provides an empty function')

  t.ok(isObject(Pred(noop)), 'returns an object')

  t.throws(Pred, TypeError, 'throws with nothing')
  t.throws(p(undefined), TypeError, 'throws with undefined')
  t.throws(p(null), TypeError, 'throws with undefined')
  t.throws(p(0), TypeError, 'throws with falsey number')
  t.throws(p(1), TypeError, 'throws with truthy number')
  t.throws(p(''), TypeError, 'throws with falsey string')
  t.throws(p('string'), TypeError, 'throws with truthy string')
  t.throws(p(false), TypeError, 'throws with false')
  t.throws(p(true), TypeError, 'throws with true')
  t.throws(p({}), TypeError, 'throws with an object')
  t.throws(p([]), TypeError, 'throws with an array')

  t.doesNotThrow(p(noop), 'allows a function')

  t.end()
})

test('Pred inspect', t => {
  const m = Pred(noop)

  t.ok(isFunction(m.inspect), 'provides an inpsect function')
  t.equal(m.inspect(), 'Pred Function', 'returns inspect string')

  t.end()
})

test('Pred type', t => {
  t.equal(Pred(noop).type(), 'Pred', 'type returns Pred')
  t.end()
})

test('Pred value', t => {
  const f = constant('some Predicate')
  const p = Pred(f)

  t.ok(isFunction(p.value), 'is a function')
  t.equal(p.value()(), f(), 'provides the wrapped function')

  t.end()
})

test('Pred runWith', t => {
  const fn = sinon.spy(constant('result'))
  const m = Pred(fn)

  const result = m.runWith(false)

  t.ok(fn.called, 'calls the wrapped function')
  t.equal(result, fn(),'returns result of the wrapped function' )

  t.end()
})

test('Pred contramap errors', t => {
  const cmap = bindFunc(Pred(noop).contramap)

  t.throws(cmap(undefined), TypeError, 'throws with undefined')
  t.throws(cmap(null), TypeError, 'throws with null')
  t.throws(cmap(0), TypeError, 'throws with falsey number')
  t.throws(cmap(1), TypeError, 'throws with truthy number')
  t.throws(cmap(''), TypeError, 'throws with falsey string')
  t.throws(cmap('string'), TypeError, 'throws with truthy string')
  t.throws(cmap(false), TypeError, 'throws with false')
  t.throws(cmap(true), TypeError, 'throws with true')
  t.throws(cmap([]), TypeError, 'throws with an array')
  t.throws(cmap({}), TypeError, 'throws with an object')

  t.doesNotThrow(cmap(noop), 'allows functions')

  t.end()
})

test('Pred contramap functionality', t => {
  const spy = sinon.spy(identity)
  const x = 23

  const m = Pred(identity).contramap(spy)

  t.equal(m.type(), 'Pred', 'returns a Pred')
  t.notOk(spy.called, 'does not call mapping function initially')

  m.runWith(x)

  t.ok(spy.called, 'calls mapping function when ran')
  t.equal(m.runWith(x), x, 'returns the result of the resulting composition')

  t.end()
})

test('Pred contramap properties (Contra Functor)', t => {
  const m = Pred(identity)

  const f = x => x + 17
  const g = x => x * 3

  const x = 32

  t.ok(isFunction(m.contramap), 'provides a contramap function')

  t.equal(m.contramap(identity).runWith(x), m.runWith(x), 'identity')
  t.equal(m.contramap(composeB(f, g)).runWith(x), m.contramap(f).contramap(g).runWith(x), 'composition')

  t.end()
})

test('Pred concat functionality', t => {
  const a = Pred(constant(true))
  const b = Pred(constant(false))

  const notPred = { type: constant('Pred...Not') }

  const cat = bindFunc(a.concat)

  t.throws(cat(undefined), TypeError, 'throws with undefined')
  t.throws(cat(null), TypeError, 'throws with null')
  t.throws(cat(0), TypeError, 'throws with falsey number')
  t.throws(cat(1), TypeError, 'throws with truthy number')
  t.throws(cat(''), TypeError, 'throws with falsey string')
  t.throws(cat('string'), TypeError, 'throws with truthy string')
  t.throws(cat(false), TypeError, 'throws with false')
  t.throws(cat(true), TypeError, 'throws with true')
  t.throws(cat([]), TypeError, 'throws with an array')
  t.throws(cat({}), TypeError, 'throws with an object')
  t.throws(cat(notPred), TypeError, 'throws when passed non-Pred')

  t.equal(a.concat(a).runWith(), true, 'true to true reports true')
  t.equal(a.concat(b).runWith(), false, 'true to false reports false')
  t.equal(b.concat(b).runWith(), false, 'false to false reports false')

  t.end()
})

test('Pred concat properties (Semigoup)', t => {
  const a = Pred(constant(false))
  const b = Pred(constant(true))
  const c = Pred(constant(false))

  const left = a.concat(b).concat(c)
  const right = a.concat(b.concat(c))

  t.ok(isFunction(a.concat), 'provides a concat function')
  t.equal(left.runWith(), right.runWith(), 'associativity')
  t.equal(a.concat(b).type(), a.type(), 'returns a Pred')

  t.end()
})

test('Pred empty functionality', t => {
  const p = Pred(identity).empty()

  t.equal(p.type(), 'Pred', 'provides a Pred')
  t.equal(p.runWith(), true, 'provides a true value')

  t.end()
})

test('Pred empty properties (Monoid)', t => {
  const m = Pred(constant(true))

  t.ok(isFunction(m.concat), 'provides a concat function')
  t.ok(isFunction(m.empty), 'provides an empty function')

  const right = m.concat(m.empty())
  const left = m.empty().concat(m)

  t.equal(right.runWith(), m.runWith(), 'right identity')
  t.equal(left.runWith(), m.runWith(), 'left identity')

  t.end()
})
