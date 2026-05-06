interface CategoryMatchBadgeProps {
  match: boolean | null
  categoryName?: string | null
  categoryExceedsLimit: boolean | null
  categoryExceedsLimitDetail?: string | null
}

export function CategoryMatchBadge({
  match,
  categoryName,
  categoryExceedsLimit,
  categoryExceedsLimitDetail,
}: CategoryMatchBadgeProps) {
  const matchOk = match ?? false
  const rows: { label: string; ok: boolean; detail?: string }[] = [
    {
      label: matchOk
        ? `Corresponde à categoria${categoryName ? ` "${categoryName}"` : ''}`
        : `Não corresponde à categoria${categoryName ? ` "${categoryName}"` : ''}`,
      ok: matchOk,
    },
    {
      label: 'Valor dentro do limite da categoria',
      ok: categoryExceedsLimit !== true,
      detail: categoryExceedsLimitDetail ?? undefined,
    },
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-gray-900">Categoria</h3>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
              row.ok ? 'bg-gray-50' : 'bg-red-50'
            }`}
          >
            <div>
              <span className={row.ok ? 'text-gray-700' : 'font-medium text-red-700'}>
                {row.label}
              </span>
              {row.detail && (
                <p className="mt-0.5 text-xs text-gray-400">{row.detail}</p>
              )}
            </div>
            <span
              className={`ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                row.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {row.ok ? 'OK' : 'Atenção'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
