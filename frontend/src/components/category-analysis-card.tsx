interface CategoryAnalysisCardProps {
  categoryMatch: boolean | null
  categoryExceedsLimit: boolean | null
  categoryExceedsLimitDetail: string | null
  categoryName?: string | null
}

export function CategoryAnalysisCard({
  categoryMatch,
  categoryExceedsLimit,
  categoryExceedsLimitDetail,
  categoryName,
}: CategoryAnalysisCardProps) {
  if (categoryMatch === null) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-gray-900">Análise de Categoria</h3>
      <ul className="space-y-1.5">
        <li
          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
            !categoryMatch ? 'bg-red-50' : 'bg-gray-50'
          }`}
        >
          <span className={!categoryMatch ? 'font-medium text-red-700' : 'text-gray-500'}>
            {categoryMatch
              ? `Corresponde à categoria "${categoryName ?? 'Desconhecida'}"`
              : 'Não corresponde à categoria selecionada'}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              !categoryMatch ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {categoryMatch ? 'OK' : 'Detectado'}
          </span>
        </li>

        {categoryExceedsLimit !== null && (
          <li
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
              categoryExceedsLimit ? 'bg-red-50' : 'bg-gray-50'
            }`}
          >
            <span className={categoryExceedsLimit ? 'font-medium text-red-700' : 'text-gray-500'}>
              Valor excede limite da categoria
              {categoryExceedsLimit && categoryExceedsLimitDetail && (
                <span className="ml-1.5 text-xs font-normal opacity-75">
                  — {categoryExceedsLimitDetail}
                </span>
              )}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                categoryExceedsLimit ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {categoryExceedsLimit ? 'Detectado' : 'OK'}
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}
