import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

export function parseKeywords(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}
