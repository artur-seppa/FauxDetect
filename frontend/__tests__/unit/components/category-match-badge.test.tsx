import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CategoryMatchBadge } from '@/components/category-match-badge'

afterEach(cleanup)

describe('CategoryMatchBadge — match row', () => {
  test('renders match text with category name', () => {
    render(<CategoryMatchBadge match={true} categoryName="Almoço" categoryExceedsLimit={false} />)
    expect(screen.getByText('Corresponde à categoria "Almoço"')).toBeDefined()
  })

  test('renders match text without category name when categoryName is omitted', () => {
    render(<CategoryMatchBadge match={true} categoryExceedsLimit={false} />)
    expect(screen.getByText('Corresponde à categoria')).toBeDefined()
  })

  test('renders match text without category name when categoryName is null', () => {
    render(<CategoryMatchBadge match={true} categoryName={null} categoryExceedsLimit={false} />)
    expect(screen.getByText('Corresponde à categoria')).toBeDefined()
  })

  test('renders no-match text with category name when match is false', () => {
    render(<CategoryMatchBadge match={false} categoryName="Uber" categoryExceedsLimit={false} />)
    expect(screen.getByText('Não corresponde à categoria "Uber"')).toBeDefined()
  })

  test('match row renders OK badge when match is true', () => {
    const { container } = render(
      <CategoryMatchBadge match={true} categoryName="Almoço" categoryExceedsLimit={false} />
    )
    const items = container.querySelectorAll('li')
    const matchItem = Array.from(items).find((li) =>
      li.textContent?.includes('Corresponde à categoria')
    )
    expect(matchItem?.textContent).toContain('OK')
  })

  test('match row renders Atenção badge when match is false', () => {
    const { container } = render(
      <CategoryMatchBadge match={false} categoryName="Uber" categoryExceedsLimit={false} />
    )
    const items = container.querySelectorAll('li')
    const matchItem = Array.from(items).find((li) =>
      li.textContent?.includes('Não corresponde')
    )
    expect(matchItem?.textContent).toContain('Atenção')
  })
})

describe('CategoryMatchBadge — category limit row', () => {
  test('renders "Valor dentro do limite da categoria" label', () => {
    render(<CategoryMatchBadge match={true} categoryName="Almoço" categoryExceedsLimit={false} />)
    expect(screen.getByText('Valor dentro do limite da categoria')).toBeDefined()
  })

  test('limit row renders OK badge when categoryExceedsLimit is false', () => {
    const { container } = render(
      <CategoryMatchBadge match={true} categoryName="Almoço" categoryExceedsLimit={false} />
    )
    const items = container.querySelectorAll('li')
    const limitItem = Array.from(items).find((li) =>
      li.textContent?.includes('Valor dentro do limite')
    )
    expect(limitItem?.textContent).toContain('OK')
  })

  test('limit row renders Atenção badge when categoryExceedsLimit is true', () => {
    const { container } = render(
      <CategoryMatchBadge match={true} categoryName="Almoço" categoryExceedsLimit={true} />
    )
    const items = container.querySelectorAll('li')
    const limitItem = Array.from(items).find((li) =>
      li.textContent?.includes('Valor dentro do limite')
    )
    expect(limitItem?.textContent).toContain('Atenção')
  })

  test('renders categoryExceedsLimitDetail when provided', () => {
    render(
      <CategoryMatchBadge
        match={true}
        categoryName="Hotel"
        categoryExceedsLimit={true}
        categoryExceedsLimitDetail="R$ 300 excede o limite de R$ 200"
      />
    )
    expect(screen.getByText('R$ 300 excede o limite de R$ 200')).toBeDefined()
  })
})

describe('CategoryMatchBadge — renders two rows', () => {
  test('always renders exactly two list items', () => {
    const { container } = render(
      <CategoryMatchBadge match={true} categoryName="Almoço" categoryExceedsLimit={false} />
    )
    expect(container.querySelectorAll('li').length).toBe(2)
  })
})
