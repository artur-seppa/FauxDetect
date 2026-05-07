import { describe, test, expect, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { FraudSignalsCard } from '@/components/fraud-signals-card'
import type { FraudSignals } from '@/lib/types'
import { renderWithIntl } from '../../test-utils'

afterEach(cleanup)

const NO_SIGNALS: FraudSignals = {
  amountExceedsCategoryLimit: false,
  geminiDigitalTampering: false,
  geminiAiGenerated: false,
  geminiNotADocument: false,
  geminiInconsistentData: false,
}

const ALL_SIGNALS: FraudSignals = {
  amountExceedsCategoryLimit: true,
  geminiDigitalTampering: true,
  geminiAiGenerated: true,
  geminiNotADocument: true,
  geminiInconsistentData: true,
}

describe('FraudSignalsCard — labels', () => {
  test('renders all four gemini signal labels', () => {
    renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    expect(screen.getByText('Adulteração digital detectada')).toBeDefined()
    expect(screen.getByText('Documento gerado por IA')).toBeDefined()
    expect(screen.getByText('Arquivo não é um documento válido')).toBeDefined()
    expect(screen.getByText('Dados inconsistentes no documento')).toBeDefined()
  })

  test('renders card heading', () => {
    renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    expect(screen.getByText('Sinais de Fraude')).toBeDefined()
  })
})

describe('FraudSignalsCard — fraud score color', () => {
  test('score < 40 renders green', () => {
    renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    const score = screen.getByText('Score: 0/100')
    expect(score.className).toContain('text-green-600')
  })

  test('score = 39 renders green', () => {
    renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={39} />)
    const score = screen.getByText('Score: 39/100')
    expect(score.className).toContain('text-green-600')
  })

  test('score = 40 renders yellow', () => {
    renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={40} />)
    const score = screen.getByText('Score: 40/100')
    expect(score.className).toContain('text-yellow-600')
  })

  test('score = 69 renders yellow', () => {
    renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={69} />)
    const score = screen.getByText('Score: 69/100')
    expect(score.className).toContain('text-yellow-600')
  })

  test('score = 70 renders red', () => {
    renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={70} />)
    const score = screen.getByText('Score: 70/100')
    expect(score.className).toContain('text-red-600')
  })

  test('score = 100 renders red', () => {
    renderWithIntl(<FraudSignalsCard signals={ALL_SIGNALS} fraudScore={100} />)
    const score = screen.getByText('Score: 100/100')
    expect(score.className).toContain('text-red-600')
  })
})

describe('FraudSignalsCard — signal badges and label colors', () => {
  test('active geminiDigitalTampering renders red label', () => {
    renderWithIntl(
      <FraudSignalsCard signals={{ ...NO_SIGNALS, geminiDigitalTampering: true }} fraudScore={50} />
    )
    const label = screen.getByText('Adulteração digital detectada')
    expect(label.className).toContain('text-red-700')
  })

  test('inactive signal renders gray label', () => {
    renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    const label = screen.getByText('Adulteração digital detectada')
    expect(label.className).toContain('text-gray-500')
  })

  test('active signal renders "Detectado" badge', () => {
    const { container } = renderWithIntl(
      <FraudSignalsCard signals={{ ...NO_SIGNALS, geminiAiGenerated: true }} fraudScore={10} />
    )
    const items = container.querySelectorAll('li')
    const aiItem = Array.from(items).find((li) =>
      li.textContent?.includes('Documento gerado por IA')
    )
    expect(aiItem?.textContent).toContain('Detectado')
  })

  test('inactive signal renders "OK" badge', () => {
    const { container } = renderWithIntl(<FraudSignalsCard signals={NO_SIGNALS} fraudScore={0} />)
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(4)
    items.forEach((li) => expect(li.textContent).toContain('OK'))
  })
})
