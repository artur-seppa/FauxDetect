interface CategoryMatchBadgeProps {
  match: boolean
  categoryName?: string | null
}

export function CategoryMatchBadge({ match, categoryName }: CategoryMatchBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{match ? '✅' : '❌'}</span>
      <span className="text-sm text-gray-700">
        {match
          ? `Corresponde à categoria "${categoryName ?? 'Desconhecida'}"`
          : 'Não corresponde à categoria selecionada'}
      </span>
    </div>
  )
}
