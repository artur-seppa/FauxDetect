import type { FraudSignals, SignalKey } from '@/lib/types'

const SIGNAL_KEYS: SignalKey[] = ['lowOcrConfidence', 'suspiciousWords', 'handwrittenReceipt']

const signalLabels: Record<SignalKey, string> = {
  lowOcrConfidence: 'Baixa confiança no OCR',
  suspiciousWords: 'Palavras suspeitas detectadas',
  handwrittenReceipt: 'Comprovante manuscrito',
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
        {SIGNAL_KEYS.map((key) => {
          const triggered = signals[key] as boolean
          const label =
            key === 'lowOcrConfidence' && signals.ocrConfidenceValue != null
              ? `${signalLabels[key]} (${signals.ocrConfidenceValue.toFixed(0)}%)`
              : signalLabels[key]
          return (
            <li
              key={key}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                triggered ? 'bg-red-50' : 'bg-gray-50'
              }`}
            >
              <span className={triggered ? 'font-medium text-red-700' : 'text-gray-500'}>
                {label}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  triggered ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {triggered ? 'Detectado' : 'OK'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
