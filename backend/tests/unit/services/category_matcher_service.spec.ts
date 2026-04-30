import { test } from '@japa/runner'
import CategoryMatcherService from '#services/category_matcher_service'

const fakeCategory = (name: string, keywords: string[]) =>
  ({ name, keywords: keywords.map((k) => ({ name: k })), active: true }) as any

test.group('CategoryMatcherService', () => {
  test('returns false when category is null', ({ assert }) => {
    assert.isFalse(new CategoryMatcherService().match(null, 'Uber', 'ride home'))
  })

  test('returns false when category has no keywords', ({ assert }) => {
    assert.isFalse(
      new CategoryMatcherService().match(fakeCategory('Unknown', []), 'Some vendor', 'some desc')
    )
  })

  test('matches Lunch by vendor name', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(
        fakeCategory('Lunch', ['restaurant', 'food', 'lunch', 'snack', 'ifood']),
        'McDonalds Restaurant',
        null
      )
    )
  })

  test('matches Lunch by description', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(
        fakeCategory('Lunch', ['restaurant', 'food', 'lunch', 'snack', 'ifood']),
        null,
        'Ordered via IFood app'
      )
    )
  })

  test('matches Uber by vendor', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(
        fakeCategory('Uber', ['uber', '99', 'ride', 'transport', 'taxi']),
        'Uber Brasil',
        null
      )
    )
  })

  test('matches Hotel by description', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(
        fakeCategory('Hotel', ['hotel', 'airbnb', 'accommodation', 'inn']),
        null,
        'Airbnb accommodation'
      )
    )
  })

  test('matches Office Supplies case-insensitively', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(
        fakeCategory('Office Supplies', ['stationery', 'office', 'pen', 'notebook']),
        'OFFICE DEPOT',
        null
      )
    )
  })

  test('matches Parking by description', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(
        fakeCategory('Parking', ['parking', 'valet', 'garage']),
        null,
        'Valet parking service'
      )
    )
  })

  test('returns false when text has no matching keywords', ({ assert }) => {
    assert.isFalse(
      new CategoryMatcherService().match(
        fakeCategory('Lunch', ['restaurant', 'food', 'lunch', 'snack', 'ifood']),
        'Shell Gas Station',
        'fuel'
      )
    )
  })

  test('combines vendor and description for matching', ({ assert }) => {
    assert.isTrue(
      new CategoryMatcherService().match(
        fakeCategory('Uber', ['uber', '99', 'ride', 'transport', 'taxi']),
        'City Transport',
        '99 ride'
      )
    )
  })
})
