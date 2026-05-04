interface FileViewerProps {
  url: string
  filename: string
}

export function FileViewer({ url, filename }: FileViewerProps) {
  const isPdf = filename.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    return (
      <iframe
        src={url}
        title={filename}
        className="h-[600px] w-full rounded-lg border border-gray-200"
      />
    )
  }

  return (
    <img
      src={url}
      alt={filename}
      className="max-h-[600px] w-full rounded-lg border border-gray-200 object-contain"
    />
  )
}
