import type Category from '#models/category'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  lunch: ['restaurant', 'food', 'lunch', 'snack', 'ifood'],
  uber: ['uber', '99', 'ride', 'transport', 'taxi'],
  hotel: ['hotel', 'airbnb', 'accommodation', 'inn'],
  'office supplies': ['stationery', 'office', 'pen', 'notebook'],
  parking: ['parking', 'valet', 'garage'],
}

export default class CategoryMatcherService {
  match(category: Category | null, vendor: string | null, description: string | null): boolean {
    if (!category) return false
    const keywords = CATEGORY_KEYWORDS[category.name.toLowerCase()] ?? []
    if (!keywords.length) return false
    const text = [vendor, description].filter(Boolean).join(' ').toLowerCase()
    return keywords.some((kw) => text.includes(kw))
  }
}
