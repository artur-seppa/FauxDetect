import { describe, test, expect } from 'vitest'
import { parseKeywords } from '@/lib/utils'

describe('parseKeywords', () => {
  test('returns empty array for undefined', () => {
    expect(parseKeywords(undefined)).toEqual([])
  })

  test('returns empty array for empty string', () => {
    expect(parseKeywords('')).toEqual([])
  })

  test('returns empty array for only whitespace', () => {
    expect(parseKeywords('   ,  ,  ')).toEqual([])
  })

  test('parses single keyword', () => {
    expect(parseKeywords('restaurante')).toEqual(['restaurante'])
  })

  test('parses comma-separated keywords', () => {
    expect(parseKeywords('restaurante, comida, almoço')).toEqual(['restaurante', 'comida', 'almoço'])
  })

  test('trims whitespace around each keyword', () => {
    expect(parseKeywords('  uber  ,  taxi  ,  99  ')).toEqual(['uber', 'taxi', '99'])
  })

  test('filters out empty entries from double commas', () => {
    expect(parseKeywords('hotel,,airbnb')).toEqual(['hotel', 'airbnb'])
  })

  test('handles keywords with no spaces after comma', () => {
    expect(parseKeywords('parking,valet,garage')).toEqual(['parking', 'valet', 'garage'])
  })
})
