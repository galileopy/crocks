const test = require('tape')
const sinon = require('sinon')
const helpers = require('../test/helpers')

const noop = helpers.noop
const bindFunc = helpers.bindFunc

const isFunction = require('../predicates/isFunction')
const isObject = require('../predicates/isObject')

const composeB = require('../combinators/composeB')
const constant = require('../combinators/constant')
const identity = require('../combinators/identity')
const reverseApply = require('../combinators/reverseApply')

const Reader = require('./Reader')

test('Reader', t => {
  const m = Reader(noop)
  const r = bindFunc(Reader)

  t.ok(isFunction(Reader), 'is a function')
  t.ok(isObject(m), 'returns an object')

  t.ok(isFunction(Reader.of), 'provides an of function')
  t.ok(isFunction(Reader.type), 'provides a type function')
  t.ok(isFunction(Reader.ask), 'provides an ask function')

  t.throws(r(), TypeError, 'throws with no parameters')

  t.throws(r(undefined), TypeError, 'throws with undefined')
  t.throws(r(null), TypeError, 'throws with null')
  t.throws(r(0), TypeError, 'throws with falsey number')
  t.throws(r(1), TypeError, 'throws with truthy number')
  t.throws(r(''), TypeError, 'throws with falsey string')
  t.throws(r('string'), TypeError, 'throws with truthy string')
  t.throws(r(false), TypeError, 'throws with false')
  t.throws(r(true), TypeError, 'throws with true')
  t.throws(r([]), TypeError, 'throws with array')
  t.throws(r({}), TypeError, 'throws with object')

  t.doesNotThrow(r(noop), 'allows a function')

  t.end()
})

test('Reader inspect', t => {
  const m = Reader(noop)

  t.ok(isFunction(m.inspect), 'provides an inspect function')
  t.equal(m.inspect(), 'Reader Function', 'returns inspect string')

  t.end()
})

test('Reader type', t => {
  t.equal(Reader(noop).type(), 'Reader', 'type returns Reader')
  t.end()
})

test('Reader runWith', t => {
  const add2 = x => x + 2
  const fn = sinon.spy(add2)
  const m = Reader(fn)
  const e = 94

  const result = m.runWith(e)

  t.ok(fn.called, 'calls the wrapped function')
  t.equal(result, fn(e), 'passes in env to the function, returning result')

  t.end()
})

test('Reader ask errors', t => {
  const ask = bindFunc(Reader.ask)

  t.throws(ask(undefined), TypeError, 'throws with undefined')
  t.throws(ask(null), TypeError, 'throws with null')
  t.throws(ask(0), TypeError, 'throws with falsey number')
  t.throws(ask(1), TypeError, 'throws with truthy number')
  t.throws(ask(''), TypeError, 'throws with falsey string')
  t.throws(ask('string'), TypeError, 'throws with truthy string')
  t.throws(ask(false), TypeError, 'throws with false')
  t.throws(ask(true), TypeError, 'throws with true')
  t.throws(ask([]), TypeError, 'throws with an array')
  t.throws(ask({}), TypeError, 'throws with an object')

  t.doesNotThrow(ask(noop), 'allows a function')

  t.end()
})

test('Reader ask functionality', t => {
  const f = sinon.spy(identity)
  const x = Reader.ask(f)

  x.runWith(3)

  t.equal(x.type(), 'Reader', 'returns a Reader')
  t.ok(f.calledWith(3), 'returned Reader wraps the passed function')
  t.end()
})

test('Reader map errors', t => {
  const map = bindFunc(Reader(noop).map)

  t.throws(map(undefined), TypeError, 'throws with undefined')
  t.throws(map(null), TypeError, 'throws with null')
  t.throws(map(0), TypeError, 'throws with falsey number')
  t.throws(map(1), TypeError, 'throws with truthy number')
  t.throws(map(''), TypeError, 'throws with falsey string')
  t.throws(map('string'), TypeError, 'throws with truthy string')
  t.throws(map(false), TypeError, 'throws with false')
  t.throws(map(true), TypeError, 'throws with true')
  t.throws(map([]), TypeError, 'throws with an array')
  t.throws(map({}), TypeError, 'throws with an object')

  t.doesNotThrow(map(noop), 'allows a function')

  t.end()
})

test('Reader map functionality', t => {
  const e = 99
  const add7 = x => x + 7
  const spy = sinon.spy(add7)

  const m = Reader(identity).map(spy)

  t.equal(m.type(), 'Reader', 'returns a Reader')
  t.notOk(spy.called, 'does not call mapping function initially')

  m.runWith()

  t.ok(spy.called, 'calls mapping function when ran')
  t.equal(m.runWith(e), add7(e), 'returns the wrapped result of the map')

  t.end()
})

test('Reader map properties (Functor)', t => {
  const m = Reader(identity)
  const e = 22

  const f = x => x + 12
  const g = x => x * 10

  t.ok(isFunction(m.map), 'provides a map function')

  t.equal(m.map(identity).runWith(e), m.runWith(e), 'identity')
  t.equal(m.map(composeB(f, g)).runWith(e), m.map(g).map(f).runWith(e), 'composition')

  t.end()
})

test('Reader ap errors', t => {
  const ap = bindFunc(Reader(noop).ap)
  const m = { type: () => 'Reader...Not' }

  t.throws(ap(undefined), TypeError, 'throws with undefined')
  t.throws(ap(null), TypeError, 'throws with null')
  t.throws(ap(0), TypeError, 'throws with falsey number')
  t.throws(ap(1), TypeError, 'throws with truthy number')
  t.throws(ap(''), TypeError, 'throws with falsey string')
  t.throws(ap('string'), TypeError, 'throws with truthy string')
  t.throws(ap(false), TypeError, 'throws with false')
  t.throws(ap(true), TypeError, 'throws with true')
  t.throws(ap([]), TypeError, 'throws with an array')
  t.throws(ap({}), TypeError, 'throws with an object')
  t.throws(ap(m), TypeError, 'throws when Non-Reader')

  t.doesNotThrow(ap(Reader(noop)), 'allows a function')

  t.end()
})

test('Reader ap properties (Apply)', t => {
  const m = Reader(constant(identity))
  const e = 92

  const add3 = x => x + 3

  const a = m.map(composeB).ap(m).ap(m)
  const b = m.ap(m.ap(m))

  t.ok(isFunction(Reader(noop).map), 'implements the Functor spec')
  t.ok(isFunction(Reader(noop).ap), 'provides an ap function')

  t.equal(a.ap(Reader(add3)).runWith(e), b.ap(Reader(add3)).runWith(e), 'composition')

  t.end()
})

test('Reader of', t => {
  t.equal(Reader.of, Reader(noop).of, 'of is the same as the instance version')
  t.equal(Reader.of(0).type(), 'Reader', 'returns a Reader')
  t.equal(Reader.of(0).runWith(22), 0, 'wraps the value passed in a Reader')

  t.end()
})

test('Reader of properties (Applicative)', t => {
  const m = Reader(constant(identity))
  const e = 38

  const add27 = x => x + 27

  t.ok(isFunction(Reader(noop).of), 'provides an of function')
  t.ok(isFunction(Reader(noop).ap), 'implements the Apply spec')

  t.equal(m.ap(Reader(add27)).runWith(e), add27(e), 'identity')
  t.equal(m.ap(Reader.of(3)).runWith(e), Reader.of(identity(3)).runWith(e), 'homomorphism')

  const a = x => m.ap(Reader.of(x))
  const b = x => Reader.of(reverseApply(x)).ap(m)

  t.equal(a(3).runWith(e), b(3).runWith(e), 'interchange')

  t.end()
})

test('Reader chain errors', t => {
  const chain = bindFunc(Reader(noop).chain)

  t.throws(chain(undefined), TypeError, 'throws with undefined')
  t.throws(chain(null), TypeError, 'throws null')
  t.throws(chain(0), TypeError, 'throws with falsey number')
  t.throws(chain(1), TypeError, 'throws with truthy number')
  t.throws(chain(''), TypeError, 'throws with falsey string')
  t.throws(chain('string'), TypeError, 'throws with truthy string')
  t.throws(chain(false), TypeError, 'throws with false')
  t.throws(chain(true), TypeError, 'throws with true')
  t.throws(chain([]), TypeError, 'throws with an array')
  t.throws(chain({}), TypeError, 'throws with an object')

  const badRtn =
    bindFunc(x => Reader(identity).chain(identity).runWith(x))

  t.throws(badRtn(undefined), TypeError, 'throws when function returns undefined')
  t.throws(badRtn(null), TypeError, 'throws when function returns null')
  t.throws(badRtn(0), TypeError, 'throws when function returns a falsey number')
  t.throws(badRtn(1), TypeError, 'throws when function returns a truthy number')
  t.throws(badRtn(''), TypeError, 'throws when function returns a falsey string')
  t.throws(badRtn('string'), TypeError, 'throws when function returns a truthy string')
  t.throws(badRtn(false), TypeError, 'throws when function returns false')
  t.throws(badRtn(true), TypeError, 'throws when function returns true')
  t.throws(badRtn([]), TypeError, 'throws when function returns an array')
  t.throws(badRtn({}), TypeError, 'throws when function returns an object')
  t.throws(badRtn(noop), TypeError, 'throws when function returns a function')

  t.end()
})

test('Reader chain properties (Chain)', t => {
  t.ok(isFunction(Reader(noop).chain), 'provides a chain function')
  t.ok(isFunction(Reader(noop).ap), 'implements the Apply spec')

  const e = 8

  const f = x => Reader(y => x + y + 2)
  const g = x => Reader(y => x + y + 10)

  const a = x => Reader(constant(x)).chain(f).chain(g)
  const b = x => Reader(constant(x)).chain(y => f(y).chain(g))

  t.equal(a(10).runWith(e), b(10).runWith(e), 'assosiativity')

  t.end()
})

test('Reader chain properties (Monad)', t => {
  t.ok(isFunction(Reader(noop).chain), 'implements the Chain spec')
  t.ok(Reader(noop).of, 'implements the Applicative spec')

  const f = x => Reader(constant(x))

  t.equal(Reader.of(3).chain(f).runWith(0), f(3).runWith(0), 'left identity')
  t.equal(f(6).chain(Reader.of).runWith(0), f(6).runWith(0), 'right identity')

  t.end()
})
