import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CategoryMatchBadge } from '@/components/category-match-badge'

afterEach(cleanup)

describe('CategoryMatchBadge — match', () => {
  test('renders ✅ when match is true', () => {
    render(<CategoryMatchBadge match={true} categoryName="Almoço" />)
    expect(screen.getByText('✅')).toBeDefined()
  })

  test('renders category name in match text', () => {
    render(<CategoryMatchBadge match={true} categoryName="Almoço" />)
    expect(screen.getByText('Corresponde à categoria "Almoço"')).toBeDefined()
  })

  test('renders fallback "Desconhecida" when categoryName is undefined', () => {
    render(<CategoryMatchBadge match={true} />)
    expect(screen.getByText('Corresponde à categoria "Desconhecida"')).toBeDefined()
  })

  test('renders fallback "Desconhecida" when categoryName is null', () => {
    render(<CategoryMatchBadge match={true} categoryName={null} />)
    expect(screen.getByText('Corresponde à categoria "Desconhecida"')).toBeDefined()
  })
})

describe('CategoryMatchBadge — no match', () => {
  test('renders ❌ when match is false', () => {
    render(<CategoryMatchBadge match={false} categoryName="Uber" />)
    expect(screen.getByText('❌')).toBeDefined()
  })

  test('renders no-match text when match is false', () => {
    render(<CategoryMatchBadge match={false} categoryName="Uber" />)
    expect(screen.getByText('Não corresponde à categoria selecionada')).toBeDefined()
  })

  test('does not show category name in no-match text', () => {
    const { container } = render(<CategoryMatchBadge match={false} categoryName="Uber" />)
    expect(container.textContent).not.toContain('Uber')
  })
})
