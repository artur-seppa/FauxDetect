import type { FraudSignals } from '@/lib/types'

const signalLabels: Record<keyof FraudSignals, string> = {
  duplicateFile: 'Arquivo duplicado',
  amountExceedsCategoryLimit: 'Valor excede limite da categoria',
  lowOcrConfidence: 'Baixa confiança no OCR',
  suspiciousWords: 'Palavras suspeitas detectadas',
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
      <ul className="space-y-1.5">
        {(Object.keys(signals) as Array<keyof FraudSignals>).map((key) => (
          <li
            key={key}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
              signals[key] ? 'bg-red-50' : 'bg-gray-50'
            }`}
          >
            <span className={signals[key] ? 'font-medium text-red-700' : 'text-gray-500'}>
              {signalLabels[key]}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                signals[key]
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {signals[key] ? 'Detectado' : 'OK'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
