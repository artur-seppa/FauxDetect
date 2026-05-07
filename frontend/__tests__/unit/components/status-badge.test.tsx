import { describe, test, expect, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { StatusBadge } from '@/components/status-badge'
import { renderWithIntl } from '../../test-utils'

afterEach(cleanup)

describe('StatusBadge', () => {
  test('renders "Processando" for processing status', () => {
    renderWithIntl(<StatusBadge status="processing" />)
    expect(screen.getByText('Processando')).toBeDefined()
  })

  test('renders "Pendente" for pending status', () => {
    renderWithIntl(<StatusBadge status="pending" />)
    expect(screen.getByText('Pendente')).toBeDefined()
  })

  test('renders "Aprovado" for approved status', () => {
    renderWithIntl(<StatusBadge status="approved" />)
    expect(screen.getByText('Aprovado')).toBeDefined()
  })

  test('renders "Rejeitado" for rejected status', () => {
    renderWithIntl(<StatusBadge status="rejected" />)
    expect(screen.getByText('Rejeitado')).toBeDefined()
  })

  test('renders "Revisão Manual" for manual_review status', () => {
    renderWithIntl(<StatusBadge status="manual_review" />)
    expect(screen.getByText('Revisão Manual')).toBeDefined()
  })

  test('applies orange color for pending', () => {
    const { container } = renderWithIntl(<StatusBadge status="pending" />)
    expect(container.firstElementChild!.className).toContain('text-orange-700')
  })

  test('applies green color for approved', () => {
    const { container } = renderWithIntl(<StatusBadge status="approved" />)
    expect(container.firstElementChild!.className).toContain('text-green-700')
  })

  test('applies red color for rejected', () => {
    const { container } = renderWithIntl(<StatusBadge status="rejected" />)
    expect(container.firstElementChild!.className).toContain('text-red-700')
  })

  test('applies yellow color for manual_review', () => {
    const { container } = renderWithIntl(<StatusBadge status="manual_review" />)
    expect(container.firstElementChild!.className).toContain('text-yellow-700')
  })

  test('applies gray color for processing', () => {
    const { container } = renderWithIntl(<StatusBadge status="processing" />)
    expect(container.firstElementChild!.className).toContain('text-gray-700')
  })

  test('merges extra className prop', () => {
    const { container } = renderWithIntl(<StatusBadge status="pending" className="my-custom-class" />)
    expect(container.firstElementChild!.className).toContain('my-custom-class')
  })
})
