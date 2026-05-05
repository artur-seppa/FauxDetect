import { test } from '@japa/runner'
import CategoryMatcherService from '#services/category_matcher_service'

const fakeCategory = (name: string, keywords: string[], maxAmount: number | null = null) =>
  ({ name, keywords: keywords.map((k) => ({ name: k })), maxAmount, active: true }) as any

const lunchCategory = fakeCategory('Lunch', ['restaurant', 'food', 'lunch', 'snack', 'ifood'])

test.group('CategoryMatcherService', () => {
  test('returns no match when category is null', ({ assert }) => {
    const result = new CategoryMatcherService().analyze(null, 'Uber', 'ride home', 50)
    assert.isFalse(result.match)
    assert.isFalse(result.exceedsLimit)
    assert.isNull(result.exceedsLimitDetail)
  })

  test('returns no match when category has no keywords', ({ assert }) => {
    const result = new CategoryMatcherService().analyze(
      fakeCategory('Unknown', []),
      'Some vendor',
      'some desc',
      50
    )
    assert.isFalse(result.match)
  })

  test('matches Lunch by vendor name', ({ assert }) => {
    const result = new CategoryMatcherService().analyze(lunchCategory, 'McDonalds Restaurant', null, 30)
    assert.isTrue(result.match)
  })

  test('matches Lunch by description', ({ assert }) => {
    const result = new CategoryMatcherService().analyze(lunchCategory, null, 'Ordered via IFood app', 30)
    assert.isTrue(result.match)
  })

  test('matches Uber by vendor', ({ assert }) => {
    const uber = fakeCategory('Uber', ['uber', '99', 'ride', 'transport', 'taxi'])
    const result = new CategoryMatcherService().analyze(uber, 'Uber Brasil', null, 20)
    assert.isTrue(result.match)
  })

  test('matches Hotel by description', ({ assert }) => {
    const hotel = fakeCategory('Hotel', ['hotel', 'airbnb', 'accommodation', 'inn'])
    const result = new CategoryMatcherService().analyze(hotel, null, 'Airbnb accommodation', 200)
    assert.isTrue(result.match)
  })

  test('matches Office Supplies case-insensitively', ({ assert }) => {
    const office = fakeCategory('Office Supplies', ['stationery', 'office', 'pen', 'notebook'])
    const result = new CategoryMatcherService().analyze(office, 'OFFICE DEPOT', null, 40)
    assert.isTrue(result.match)
  })

  test('matches Parking by description', ({ assert }) => {
    const parking = fakeCategory('Parking', ['parking', 'valet', 'garage'])
    const result = new CategoryMatcherService().analyze(parking, null, 'Valet parking service', 15)
    assert.isTrue(result.match)
  })

  test('returns false when text has no matching keywords', ({ assert }) => {
    const result = new CategoryMatcherService().analyze(lunchCategory, 'Shell Gas Station', 'fuel', 50)
    assert.isFalse(result.match)
  })

  test('combines vendor and description for matching', ({ assert }) => {
    const uber = fakeCategory('Uber', ['uber', '99', 'ride', 'transport', 'taxi'])
    const result = new CategoryMatcherService().analyze(uber, 'City Transport', '99 ride', 20)
    assert.isTrue(result.match)
  })

  test('flags exceedsLimit when amount is above category max', ({ assert }) => {
    const cat = fakeCategory('Lunch', ['food'], 100)
    const result = new CategoryMatcherService().analyze(cat, 'Restaurant', null, 150)
    assert.isTrue(result.exceedsLimit)
    assert.include(result.exceedsLimitDetail!, '150')
    assert.include(result.exceedsLimitDetail!, '100')
  })

  test('does not flag exceedsLimit when amount is within category max', ({ assert }) => {
    const cat = fakeCategory('Lunch', ['food'], 100)
    const result = new CategoryMatcherService().analyze(cat, 'Restaurant', null, 80)
    assert.isFalse(result.exceedsLimit)
    assert.isNull(result.exceedsLimitDetail)
  })

  test('does not flag exceedsLimit when category has no max amount', ({ assert }) => {
    const result = new CategoryMatcherService().analyze(lunchCategory, 'Restaurant', null, 9999)
    assert.isFalse(result.exceedsLimit)
  })
})
