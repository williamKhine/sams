export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes.toLocaleString()} bytes`
  return `${(bytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`
}
