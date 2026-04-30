import type { FraudSignals } from '@/lib/types'

const signalLabels: Record<keyof FraudSignals, string> = {
  duplicate_file: 'Arquivo duplicado',
  amount_exceeds_category_limit: 'Valor excede limite da categoria',
  low_ocr_confidence: 'Baixa confiança no OCR',
  suspicious_words: 'Palavras suspeitas detectadas',
}

interface FraudSignalsCardProps {
  signals: FraudSignals
  fraudScore: number
}

export function FraudSignalsCard({ signals, fraudScore }: FraudSignalsCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Sinais de Fraude</h3>
        <span
          className={`text-sm font-bold ${
            fraudScore >= 70
              ? 'text-red-600'
              : fraudScore >= 40
                ? 'text-yellow-600'
                : 'text-green-600'
          }`}
        >
          Score: {fraudScore}/100
        </span>
      </div>
      <ul className="space-y-2">
        {(Object.keys(signals) as Array<keyof FraudSignals>).map((key) => (
          <li key={key} className="flex items-center gap-2 text-sm">
            <span>{signals[key] ? '🔴' : '🟢'}</span>
            <span className={signals[key] ? 'text-red-700' : 'text-gray-500'}>
              {signalLabels[key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
