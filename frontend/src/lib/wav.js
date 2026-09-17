export function downsample(float32, fromRate, toRate) {
  if (fromRate === toRate) return float32
  const ratio = fromRate / toRate
  const length = Math.max(1, Math.round(float32.length / ratio))
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    const start = Math.floor(i * ratio)
    const end = Math.min(float32.length, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = start; j < end; j += 1) sum += float32[j]
    out[i] = sum / Math.max(1, end - start)
  }
  return out
}

export function floatToWav(float32, sampleRate) {
  const buffer = new ArrayBuffer(44 + float32.length * 2)
  const view = new DataView(buffer)
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + float32.length * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, float32.length * 2, true)
  let offset = 44
  for (let i = 0; i < float32.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

export async function mediaBlobToWav(blob, targetRate = 16000) {
  const ctx = new AudioContext()
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
  const mono = decoded.numberOfChannels > 1
    ? mixDown(decoded)
    : decoded.getChannelData(0)
  const samples = downsample(mono, decoded.sampleRate, targetRate)
  await ctx.close()
  return floatToWav(samples, targetRate)
}

function mixDown(buffer) {
  const length = buffer.length
  const out = new Float32Array(length)
  const channels = buffer.numberOfChannels
  for (let c = 0; c < channels; c += 1) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < length; i += 1) out[i] += data[i] / channels
  }
  return out
}
