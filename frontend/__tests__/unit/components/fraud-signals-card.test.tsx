import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { FraudSignalsCard } from '@/components/fraud-signals-card'

afterEach(cleanup)
import type { FraudSignals } from '@/lib/types'

const NO_SIGNALS: FraudSignals = {
  duplicateFile: false,
  amountExceedsCategoryLimit: false,
  lowOcrConfidence: false,
  suspiciousWords: false,
}

const ALL_SIGNALS: FraudSignals = {
  duplicateFile: true,
  amountExceedsCategoryLimit: true,
  lowOcrConfidence: true,
  suspiciousWords: true,
}

describe('FraudSignalsCard — labels', () => {
  test('renders all four signal labels', () => {
    render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    expect(screen.getByText('Arquivo duplicado')).toBeDefined()
    expect(screen.getByText('Valor excede limite da categoria')).toBeDefined()
    expect(screen.getByText('Baixa confiança no OCR')).toBeDefined()
    expect(screen.getByText('Palavras suspeitas detectadas')).toBeDefined()
  })

  test('renders card heading', () => {
    render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    expect(screen.getByText('Sinais de Fraude')).toBeDefined()
  })
})

describe('FraudSignalsCard — fraud score color', () => {
  test('score < 40 renders green', () => {
    render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    const score = screen.getByText('Score: 0/100')
    expect(score.className).toContain('text-green-600')
  })

  test('score = 39 renders green', () => {
    render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={39} />)
    const score = screen.getByText('Score: 39/100')
    expect(score.className).toContain('text-green-600')
  })

  test('score = 40 renders yellow', () => {
    render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={40} />)
    const score = screen.getByText('Score: 40/100')
    expect(score.className).toContain('text-yellow-600')
  })

  test('score = 69 renders yellow', () => {
    render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={69} />)
    const score = screen.getByText('Score: 69/100')
    expect(score.className).toContain('text-yellow-600')
  })

  test('score = 70 renders red', () => {
    render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={70} />)
    const score = screen.getByText('Score: 70/100')
    expect(score.className).toContain('text-red-600')
  })

  test('score = 100 renders red', () => {
    render(<FraudSignalsCard signals={ALL_SIGNALS} fraudScore={100} />)
    const score = screen.getByText('Score: 100/100')
    expect(score.className).toContain('text-red-600')
  })
})

describe('FraudSignalsCard — signal badges and label colors', () => {
  test('active signal renders red label', () => {
    render(<FraudSignalsCard signals={{ ...NO_SIGNALS, duplicateFile: true }} fraudScore={50} />)
    const label = screen.getByText('Arquivo duplicado')
    expect(label.className).toContain('text-red-700')
  })

  test('inactive signal renders gray label', () => {
    render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    const label = screen.getByText('Arquivo duplicado')
    expect(label.className).toContain('text-gray-500')
  })

  test('active signal renders "Detectado" badge', () => {
    const { container } = render(
      <FraudSignalsCard signals={{ ...NO_SIGNALS, suspiciousWords: true }} fraudScore={10} />
    )
    const items = container.querySelectorAll('li')
    const suspiciousItem = Array.from(items).find((li) =>
      li.textContent?.includes('Palavras suspeitas detectadas')
    )
    expect(suspiciousItem?.textContent).toContain('Detectado')
  })

  test('inactive signal renders "OK" badge', () => {
    const { container } = render(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(4)
    items.forEach((li) => expect(li.textContent).toContain('OK'))
  })
})
