function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read that photo.'))
    reader.readAsDataURL(blob)
  })
}

export async function prepareExplainPhoto(file) {
  if (!file) throw new Error('Take or choose a photo first.')

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Please use a JPEG or PNG photo.')
  }

  const maxEdge = 1280
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height, 1))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    throw new Error('Could not read that photo.')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72))
  if (!blob) throw new Error('Could not read that photo.')
  const preview = await blobToDataUrl(blob)
  const comma = preview.indexOf(',')
  return {
    data: comma >= 0 ? preview.slice(comma + 1) : preview,
    mime: 'image/jpeg',
    preview,
  }
}
