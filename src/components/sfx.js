// 짧은 효과음 (파일 없이 브라우저에서 바로 만들어 냄)
// 효과음 파일이 생기면 public/sfx/<이름>.mp3 로 올려 바꿔 끼울 수 있게 이름을 맞춰 둠
let ctx = null
let master = null // 모든 소리가 지나가는 볼륨 (음소거용)
let muted = false
try {
  muted = localStorage.getItem('hnu-muted') === '1'
} catch {
  /* 저장소를 못 쓰면 소리 켬 */
}
const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
export const isMuted = () => muted
export function setMuted(m) {
  muted = m
  try {
    localStorage.setItem('hnu-muted', m ? '1' : '0')
  } catch {
    /* 무시 */
  }
  if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05)
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
  o.connect(g).connect(master)
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
  s.connect(f).connect(g).connect(master)
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
    case 'trudge': // 터벅터벅 다가오는 발소리 (점점 가까워짐)
      for (let i = 0; i < 6; i++) {
        noise(c, { dur: 0.09, vol: 0.05 + i * 0.025, at: i * 0.4, hp: 180 })
        tone(c, { freq: 90, to: 60, dur: 0.08, type: 'triangle', vol: 0.04 + i * 0.02, at: i * 0.4 })
      }
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
    case 'tick': // 대사 넘기기
      tone(c, { freq: 880, to: 660, dur: 0.06, type: 'square', vol: 0.025 })
      break
    case 'blip': // 글자 나올 때 (아주 작게)
      tone(c, { freq: 520 + Math.random() * 80, dur: 0.035, type: 'square', vol: 0.012 })
      break
    case 'select': // 선택 · 장소 누르기
      tone(c, { freq: 660, dur: 0.08, type: 'triangle', vol: 0.08 })
      tone(c, { freq: 990, dur: 0.12, type: 'triangle', vol: 0.07, at: 0.06 })
      break
    case 'deny': // 잠긴 장소
      tone(c, { freq: 220, to: 160, dur: 0.18, type: 'square', vol: 0.04 })
      tone(c, { freq: 180, to: 130, dur: 0.2, type: 'square', vol: 0.035, at: 0.12 })
      break
    case 'pop': // 창 열기
      tone(c, { freq: 420, to: 840, dur: 0.1, type: 'sine', vol: 0.08 })
      break
    case 'item': // 아이템 들어옴
      ;[784, 988, 1318].forEach((f, i) => tone(c, { freq: f, dur: 0.16, vol: 0.07, at: i * 0.07, type: 'triangle' }))
      break
    case 'complete': // 완료 효과음
      ;[523, 659, 784, 1046].forEach((f, i) => tone(c, { freq: f, dur: 0.22, vol: 0.09, at: i * 0.09, type: 'triangle' }))
      break
    default:
  }
}

// ── 배경 음악 (파일 없이 만들어 냄) ──
// 'bright': 밝은 분위기 · 'piano': 잔잔한 피아노
// 음악 파일이 생기면 public/bgm/<이름>.mp3 로 바꿔 끼울 수 있게 이름을 맞춰 둠
let bgm = null
const SONGS = {
  // 이별 · 마지막 장면: 느린 단조 피아노 (Am - F - Dm - E)
  sad: {
    beat: 0.62,
    vol: 0.065,
    type: 'sine',
    notes: [220, 262, 330, 440, 175, 220, 262, 349, 147, 175, 220, 294, 165, 208, 247, 330],
    bass: [110, 0, 0, 0, 87, 0, 0, 0, 73, 0, 0, 0, 82, 0, 0, 0],
  },
  // 지도 화면: 느긋한 산책 느낌
  map: {
    beat: 0.36,
    vol: 0.035,
    type: 'triangle',
    notes: [392, 494, 587, 494, 330, 392, 494, 392, 349, 440, 523, 440, 392, 494, 587, 784],
    bass: [98, 0, 0, 0, 82, 0, 0, 0, 87, 0, 0, 0, 98, 0, 0, 0],
  },
  // 인사례교양동: 햇볕 드는 오후, 잔잔하게
  calm: {
    beat: 0.48,
    vol: 0.05,
    type: 'sine',
    notes: [349, 440, 523, 659, 330, 392, 523, 587, 294, 349, 440, 523, 392, 494, 587, 698],
    bass: [87, 0, 0, 0, 82, 0, 0, 0, 73, 0, 0, 0, 98, 0, 0, 0],
  },
  // 린튼공원: 티격태격 장난스럽게
  play: {
    beat: 0.2,
    vol: 0.04,
    type: 'square',
    notes: [523, 0, 659, 523, 587, 0, 494, 0, 523, 0, 659, 784, 698, 0, 587, 0],
    bass: [131, 0, 196, 0, 147, 0, 196, 0, 131, 0, 196, 0, 175, 0, 147, 0],
  },
  // 쪽문: 골목 점심시간
  street: {
    beat: 0.24,
    vol: 0.04,
    type: 'triangle',
    notes: [440, 554, 659, 554, 494, 587, 740, 587, 440, 554, 659, 880, 740, 659, 587, 494],
    bass: [110, 0, 165, 0, 123, 0, 185, 0, 110, 0, 165, 0, 147, 0, 123, 0],
  },
  // 미니게임: 빠르게
  game: {
    beat: 0.13,
    vol: 0.04,
    type: 'square',
    notes: [659, 784, 880, 784, 659, 784, 988, 880, 587, 698, 880, 698, 659, 784, 1047, 988],
    bass: [165, 0, 165, 0, 165, 0, 196, 0, 147, 0, 147, 0, 165, 0, 196, 0],
  },
  bright: {
    beat: 0.25,
    vol: 0.05,
    type: 'triangle',
    // C - Am - F - G (8분음표 아르페지오)
    notes: [523, 659, 784, 659, 440, 523, 659, 523, 349, 440, 523, 440, 392, 494, 587, 494],
    bass: [131, 0, 0, 0, 110, 0, 0, 0, 87, 0, 0, 0, 98, 0, 0, 0],
  },
  piano: {
    beat: 0.42,
    vol: 0.07,
    type: 'sine',
    // C - G - Am - F (느린 분산화음)
    notes: [262, 392, 523, 659, 196, 294, 494, 587, 220, 330, 523, 659, 175, 262, 440, 523],
    bass: [131, 0, 0, 0, 98, 0, 0, 0, 110, 0, 0, 0, 87, 0, 0, 0],
  },
}
function pianoNote(c, out, freq, t, dur, type) {
  const o = c.createOscillator()
  const o2 = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o2.type = 'sine'
  o.frequency.value = freq
  o2.frequency.value = freq * 2 // 배음 조금
  const g2 = c.createGain()
  g2.gain.value = 0.15
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(1, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  o2.connect(g2).connect(g)
  g.connect(out)
  o.start(t)
  o2.start(t)
  o.stop(t + dur + 0.05)
  o2.stop(t + dur + 0.05)
}
export function playBgm(name, vol, fade = 1.5) {
  const c = audio()
  const song = SONGS[name]
  if (!c || !song) return
  if (bgm && bgm.name === name) return // 이미 같은 음악
  stopBgm(fade)
  const out = c.createGain()
  out.gain.setValueAtTime(0.0001, c.currentTime)
  out.gain.exponentialRampToValueAtTime(vol ?? song.vol, c.currentTime + fade)
  out.connect(master)
  const me = { name, out, timer: 0, next: c.currentTime + 0.1, i: 0 }
  // 조금씩 앞서 예약 (탭이 바쁠 때도 끊기지 않게)
  const tick = () => {
    while (me.next < c.currentTime + 0.6) {
      const k = me.i % song.notes.length
      if (song.notes[k]) pianoNote(c, out, song.notes[k], me.next, song.beat * 2.2, song.type)
      if (song.bass[k]) pianoNote(c, out, song.bass[k], me.next, song.beat * 6, 'sine')
      me.next += song.beat
      me.i += 1
    }
  }
  tick()
  me.timer = setInterval(tick, 200)
  bgm = me
}
// 볼륨을 sec 초 동안 vol 로 (음악은 계속)
export function bgmVolume(vol, sec = 2) {
  if (!bgm || !ctx) return
  const g = bgm.out.gain
  g.cancelScheduledValues(ctx.currentTime)
  g.setValueAtTime(Math.max(0.0001, g.value), ctx.currentTime)
  g.exponentialRampToValueAtTime(Math.max(0.0001, vol), ctx.currentTime + sec)
}
export function stopBgm(fade = 1) {
  if (!bgm || !ctx) return
  const me = bgm
  bgm = null
  const g = me.out.gain
  g.cancelScheduledValues(ctx.currentTime)
  g.setValueAtTime(Math.max(0.0001, g.value), ctx.currentTime)
  g.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.max(0.05, fade))
  setTimeout(() => {
    clearInterval(me.timer)
    me.out.disconnect()
  }, Math.max(0.05, fade) * 1000 + 100)
}
