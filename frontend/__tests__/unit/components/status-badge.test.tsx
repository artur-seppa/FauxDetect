import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { StatusBadge } from '@/components/status-badge'

afterEach(cleanup)

describe('StatusBadge', () => {
  test('renders "Processando" for processing status', () => {
    render(<StatusBadge status="processing" />)
    expect(screen.getByText('Processando')).toBeDefined()
  })

  test('renders "Pendente" for pending status', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('Pendente')).toBeDefined()
  })

  test('renders "Aprovado" for approved status', () => {
    render(<StatusBadge status="approved" />)
    expect(screen.getByText('Aprovado')).toBeDefined()
  })

  test('renders "Rejeitado" for rejected status', () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText('Rejeitado')).toBeDefined()
  })

  test('renders "Revisão Manual" for manual_review status', () => {
    render(<StatusBadge status="manual_review" />)
    expect(screen.getByText('Revisão Manual')).toBeDefined()
  })

  test('applies orange color for pending', () => {
    const { container } = render(<StatusBadge status="pending" />)
    expect(container.firstElementChild!.className).toContain('text-orange-700')
  })

  test('applies green color for approved', () => {
    const { container } = render(<StatusBadge status="approved" />)
    expect(container.firstElementChild!.className).toContain('text-green-700')
  })

  test('applies red color for rejected', () => {
    const { container } = render(<StatusBadge status="rejected" />)
    expect(container.firstElementChild!.className).toContain('text-red-700')
  })

  test('applies yellow color for manual_review', () => {
    const { container } = render(<StatusBadge status="manual_review" />)
    expect(container.firstElementChild!.className).toContain('text-yellow-700')
  })

  test('applies gray color for processing', () => {
    const { container } = render(<StatusBadge status="processing" />)
    expect(container.firstElementChild!.className).toContain('text-gray-700')
  })

  test('merges extra className prop', () => {
    const { container } = render(<StatusBadge status="pending" className="my-custom-class" />)
    expect(container.firstElementChild!.className).toContain('my-custom-class')
  })
})
