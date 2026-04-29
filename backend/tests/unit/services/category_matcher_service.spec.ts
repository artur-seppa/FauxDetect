import { test } from '@japa/runner'
import CategoryMatcherService from '#services/category_matcher_service'

const fakeCategory = (name: string) => ({ name, active: true }) as any

test.group('CategoryMatcherService', () => {
  test('returns false when category is null', ({ assert }) => {
    assert.isFalse(new CategoryMatcherService().match(null, 'Uber', 'ride home'))
  })

  test('returns false when category has no mapped keywords', ({ assert }) => {
    assert.isFalse(
      new CategoryMatcherService().match(fakeCategory('Unknown'), 'Some vendor', 'some desc')
    )
  })

  test('matches Lunch by vendor name', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(fakeCategory('Lunch'), 'McDonalds Restaurant', null)
    )
  })

  test('matches Lunch by description', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(fakeCategory('Lunch'), null, 'Ordered via IFood app')
    )
  })

  test('matches Uber by vendor', ({ assert }) => {
    assert.isTrue(new CategoryMatcherService().match(fakeCategory('Uber'), 'Uber Brasil', null))
  })

  test('matches Hotel by description', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(fakeCategory('Hotel'), null, 'Airbnb accommodation')
    )
  })

  test('matches Office Supplies case-insensitively', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(fakeCategory('Office Supplies'), 'OFFICE DEPOT', null)
    )
  })

  test('matches Parking by description', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(fakeCategory('Parking'), null, 'Valet parking service')
    )
  })

  test('returns false when text has no matching keywords', ({ assert }) => {
    assert.isFalse(
      new CategoryMatcherService().match(fakeCategory('Lunch'), 'Shell Gas Station', 'fuel')
    )
  })

  test('combines vendor and description for matching', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(fakeCategory('Uber'), 'City Transport', '99 ride')
    )
  })
})
