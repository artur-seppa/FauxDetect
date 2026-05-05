import type Category from '#models/category'

export type CategoryAnalysisResult = {
  match: boolean
  exceedsLimit: boolean
  exceedsLimitDetail: string | null
}

export default class CategoryMatcherService {
  analyze(
    category: Category | null,
    vendor: string | null,
    description: string | null,
    extractedAmount: number | null
  ): CategoryAnalysisResult {
    const match = this.#match(category, vendor, description)
    const exceedsLimit = this.#exceedsLimit(extractedAmount, category)
    const maxAmount = category?.maxAmount != null ? Number(category.maxAmount) : null
    const exceedsLimitDetail =
      exceedsLimit && extractedAmount && maxAmount
        ? `R$ ${extractedAmount.toFixed(2)} > limite R$ ${maxAmount.toFixed(2)}`
        : null

    return { match, exceedsLimit, exceedsLimitDetail }
  }

  #match(category: Category | null, vendor: string | null, description: string | null): boolean {
    if (!category || !category.keywords?.length) return false
    const text = [vendor, description].filter(Boolean).join(' ').toLowerCase()
    return category.keywords.some((kw) => text.includes(kw.name.toLowerCase()))
  }

  #exceedsLimit(amount: number | null, category: Category | null): boolean {
    if (!amount || !category?.maxAmount) return false
    return amount > Number(category.maxAmount)
  }
}
