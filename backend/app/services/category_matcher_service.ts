import type Category from '#models/category'

export default class CategoryMatcherService {
  match(category: Category | null, vendor: string | null, description: string | null): boolean {
    if (!category || !category.keywords?.length) return false
    const text = [vendor, description].filter(Boolean).join(' ').toLowerCase()
    return category.keywords.some((kw) => text.includes(kw.name.toLowerCase()))
  }
}
