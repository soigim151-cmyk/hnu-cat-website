// 짧은 효과음 (파일 없이 브라우저에서 바로 만들어 냄)
// 효과음 파일이 생기면 public/sfx/<이름>.mp3 로 올려 바꿔 끼울 수 있게 이름을 맞춰 둠
let ctx = null
const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(c, { freq, to, dur, type = 'sine', vol = 0.12, at = 0 }) {
  const t = c.currentTime + at
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function noise(c, { dur, vol = 0.08, at = 0, hp = 800 }) {
  const t = c.currentTime + at
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const s = c.createBufferSource()
  s.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = hp
  const g = c.createGain()
  g.gain.value = vol
  s.connect(f).connect(g).connect(c.destination)
  s.start(t)
}

export function playSfx(name) {
  const c = audio()
  if (!c) return
  switch (name) {
    case 'ding': // 이름 공개 알림음
      tone(c, { freq: 1046, dur: 0.18, vol: 0.1 })
      tone(c, { freq: 1568, dur: 0.3, vol: 0.08, at: 0.09 })
      break
    case 'comic': // 짧은 코믹 효과음
      tone(c, { freq: 220, to: 660, dur: 0.18, type: 'square', vol: 0.05 })
      tone(c, { freq: 660, to: 330, dur: 0.22, type: 'square', vol: 0.04, at: 0.18 })
      break
    case 'steps': // 빠른 발소리
      for (let i = 0; i < 4; i++) noise(c, { dur: 0.05, vol: 0.12, at: i * 0.13, hp: 300 })
      break
    case 'stand': // 벤치에서 일어나는 소리
      tone(c, { freq: 140, to: 70, dur: 0.15, type: 'triangle', vol: 0.18 })
      noise(c, { dur: 0.08, vol: 0.06, hp: 400 })
      break
    case 'rustle': // 봉투 소리
      noise(c, { dur: 0.35, vol: 0.06, hp: 2500 })
      break
    case 'whoosh':
      noise(c, { dur: 0.3, vol: 0.05, hp: 1200 })
      break
    case 'complete': // 완료 효과음
      ;[523, 659, 784, 1046].forEach((f, i) => tone(c, { freq: f, dur: 0.22, vol: 0.09, at: i * 0.09, type: 'triangle' }))
      break
    default:
  }
}
