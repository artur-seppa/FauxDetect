export interface MockCategory {
  id: number
  name: string
  maxAmount: number | null
  active: boolean
  keywords: string[]
}

export const INITIAL_CATEGORIES: MockCategory[] = [
  { id: 1, name: 'Almoço', maxAmount: 50, active: true, keywords: ['restaurante', 'comida', 'almoço'] },
  { id: 2, name: 'Uber', maxAmount: 100, active: true, keywords: ['uber', 'taxi'] },
  { id: 3, name: 'Hotel', maxAmount: null, active: false, keywords: [] },
]
