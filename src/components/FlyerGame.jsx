// 미니게임: 선거 홍보물 나눠주기 (학생회관)
// 안내창 → 3·2·1·START → 25초 안에 홍보물 12장 전달 (실수 3회면 실패)
// 끝나면 onDone('clear' | 'quit')
import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from './sfx.js'
import './FlyerGame.css'

const GOAL = 12
const TIME = 25
const MAX_MISS = 3

const WANT = ['하나 주세요!', '공약집이요?', '저도 받을게요.', '어떤 공약인데요?']
const REFUSE = ['지금 바빠요.', '이미 받았어요.', '괜찮습니다.', '다음에 받을게요.']

// 이동 경로 3개: 앞(크고 느림) · 중간 · 뒤(작고 빠름)
const LANES = [
  { h: 30, bottom: 26, speed: 22, z: 1 }, // 뒤
  { h: 40, bottom: 12, speed: 18, z: 2 }, // 중간
  { h: 52, bottom: -4, speed: 15, z: 3 }, // 앞
]

// 전달한 수량에 따라 단계가 바뀜
const stageOf = (n) =>
  n <= 4
    ? { speed: 1, bubble: 2, max: 4, want: 0.78, fast: 0.06 }
    : n <= 8
      ? { speed: 1.2, bubble: 1.5, max: 4, want: 0.68, fast: 0.12 }
      : { speed: 1.4, bubble: 1.2, max: 5, want: 0.6, fast: 0.18 }

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const fmt = (s) => `00:${String(Math.max(0, Math.ceil(s))).padStart(2, '0')}`

export default function FlyerGame({ bg, hannam, npcs: npcImgs, flyer, onDone }) {
  const [phase, setPhase] = useState('intro') // intro · count · play · clear · fail
  const [count, setCount] = useState(null) // 3 · 2 · 1 · START!
  const [, setFrame] = useState(0)
  const [say, setSay] = useState(null) // 한남이 말풍선
  const [failStep, setFailStep] = useState(0)
  const [fx, setFx] = useState([]) // +1 · MISS · 날아가는 홍보물
  const [pulse, setPulse] = useState('') // HUD 강조
  const g = useRef(null) // 게임 상태 (매 프레임 바뀌는 값)
  const rafRef = useRef(0)
  const sayTimer = useRef(0)
  const rootRef = useRef(null)

  const reset = () => {
    g.current = { npcs: [], got: 0, miss: 0, left: TIME, spawnIn: 0.3, id: 0, said5: false, last: 0, over: false }
  }
  if (!g.current) reset()

  const talk = useCallback((text) => {
    clearTimeout(sayTimer.current)
    setSay(text)
    sayTimer.current = setTimeout(() => setSay(null), 1500)
  }, [])

  const addFx = (f) => {
    const id = Math.random()
    setFx((list) => [...list, { ...f, id }])
    setTimeout(() => setFx((list) => list.filter((x) => x.id !== id)), 900)
  }

  // ── 학생 만들기 ──
  const spawn = () => {
    const s = g.current
    const st = stageOf(s.got)
    const wantsOnScreen = s.npcs.some((n) => n.type === 'want' && !n.served && n.phase !== 'leave')
    const r = Math.random()
    const type = !wantsOnScreen && r < 0.85 ? 'want' : r < st.fast ? 'fast' : r < st.fast + st.want ? 'want' : 'refuse'
    const laneIdx = type === 'fast' ? 0 : Math.floor(Math.random() * 3)
    const lane = LANES[laneIdx]
    const dir = Math.random() < 0.5 ? 1 : -1
    const speed = (type === 'fast' ? 34 + Math.random() * 10 : lane.speed * (type === 'refuse' ? 1.5 : 1) * (0.85 + Math.random() * 0.3)) * st.speed
    s.npcs.push({
      id: ++s.id,
      type,
      lane: laneIdx,
      img: pick(npcImgs),
      dir,
      x: dir > 0 ? -8 : 108, // vw (화면 가장자리에서 등장)
      speed,
      phase: 'walk',
      // 홍보물을 받는 학생: 화면 안쪽 어딘가에서 잠시 멈추며 말풍선
      stopAt: 10 + Math.random() * 24,
      bubble: type === 'want' ? pick(WANT) : type === 'refuse' ? pick(REFUSE) : null,
      bubbleDur: st.bubble,
      askLeft: 0,
      served: false,
    })
  }

  // ── 게임 루프 ──
  const loop = useCallback((t) => {
    const s = g.current
    const dt = Math.min(0.05, s.last ? (t - s.last) / 1000 : 0)
    s.last = t
    if (s.over) return

    s.left -= dt
    if (!s.said5 && s.left <= 5) {
      s.said5 = true
      talk('시간이 얼마 안 남았어요!')
    }
    if (s.left <= 0) return finish('fail')

    const st = stageOf(s.got)
    s.spawnIn -= dt
    if (s.spawnIn <= 0 && s.npcs.length < st.max) {
      spawn()
      s.spawnIn = 0.4 + Math.random() * 0.4
    }

    for (const n of s.npcs) {
      const pos = n.dir > 0 ? n.x : 100 - n.x // 들어온 방향 기준 진행 정도
      if (n.type === 'want' && n.phase === 'walk' && !n.served && pos >= n.stopAt) {
        n.phase = 'ask'
        n.askLeft = n.bubbleDur
      }
      let v = n.speed
      if (n.phase === 'ask') {
        v *= 0.18 // 말풍선 동안 거의 멈춤
        n.askLeft -= dt
        if (n.askLeft <= 0) n.phase = 'gone' // 말풍선이 사라지고 다시 걸어감
      }
      if (n.phase === 'gone') v *= 2.5 // 못 받고 지나감 → 서둘러 퇴장
      if (n.phase === 'leave') {
        v *= 1.8
        n.fade = (n.fade || 0) + dt // 받은 학생은 금방 사라짐
      }
      n.x += n.dir * v * dt
    }
    s.npcs = s.npcs.filter((n) => n.x > -25 && n.x < 125 && !(n.fade > 0.55))
    setFrame((f) => f + 1)
    rafRef.current = requestAnimationFrame(loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = (result) => {
    const s = g.current
    s.over = true
    cancelAnimationFrame(rafRef.current)
    setFrame((f) => f + 1)
    if (result === 'clear') {
      playSfx('complete')
      setPhase('clear')
    } else {
      playSfx('comic')
      setPhase('fail')
      setFailStep(0)
      setTimeout(() => setFailStep(1), 1200)
    }
  }

  // ── 학생 클릭 ──
  const hit = (n, e) => {
    e.stopPropagation()
    const s = g.current
    if (s.over || phase !== 'play') return
    const r = rootRef.current.getBoundingClientRect()
    const at = { x: e.clientX - r.left, y: e.clientY - r.top }
    // 겹쳐 있을 때: 누른 자리에 홍보물을 원하는 학생이 있으면 그 학생에게 전달
    const wanting = (m) => m.type === 'want' && m.phase === 'ask' && !m.served
    if (!wanting(n)) {
      const under = document
        .elementsFromPoint(e.clientX, e.clientY)
        .map((el) => el.closest?.('.fg__npc')?.dataset.id)
        .map((id) => s.npcs.find((m) => String(m.id) === id))
        .find((m) => m && wanting(m))
      if (under) n = under
    }
    if (n.served && performance.now() - n.servedAt < 500) return // 연달아 누른 건 무시
    if (n.type === 'want' && n.phase === 'ask' && !n.served) {
      n.served = true
      n.servedAt = performance.now()
      n.phase = 'leave'
      s.got += 1
      playSfx('rustle')
      addFx({ kind: 'plus', ...at })
      addFx({ kind: 'fly', ...at })
      if (s.got === 4) talk('좋아요! 이대로만 해주세요!')
      if (s.got === 8) {
        talk('이제 조금만 더 하면 돼요!')
        setPulse('got')
        setTimeout(() => setPulse(''), 900)
      }
      if (s.got >= GOAL) finish('clear')
    } else {
      s.miss += 1
      playSfx('whoosh')
      addFx({ kind: 'miss', ...at })
      if (s.miss === 1) talk('저 학생은 이미 받았나 봐요.')
      if (s.miss === 2) {
        talk('조금만 더 신중하게 부탁드릴게요!')
        setPulse('miss')
        setTimeout(() => setPulse(''), 900)
      }
      if (s.miss >= MAX_MISS) finish('fail')
    }
    setFrame((f) => f + 1)
  }

  // ── 시작: 3 → 2 → 1 → START! ──
  const start = async (e) => {
    e?.stopPropagation()
    reset()
    setSay(null)
    setPhase('count')
    for (const c of ['3', '2', '1', 'START!']) {
      setCount(c)
      playSfx(c === 'START!' ? 'ding' : 'stand')
      await new Promise((r) => setTimeout(r, 700))
    }
    setCount(null)
    setPhase('play')
    g.current.last = 0
    rafRef.current = requestAnimationFrame(loop)
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(sayTimer.current)
    },
    [],
  )

  const s = g.current
  const st = stageOf(s.got)

  return (
    <div className="fg" ref={rootRef} onClick={(e) => e.stopPropagation()}>
      <img className="fg__bg" src={bg} alt="" />

      {/* 학생들 */}
      {s.npcs.map((n) => {
        const lane = LANES[n.lane]
        const showBubble = (n.type === 'want' && n.phase === 'ask') || n.type === 'refuse'
        return (
          <button
            type="button"
            key={n.id}
            data-id={n.id}
            className={`fg__npc fg__npc--${n.type}${n.served ? ' is-served' : ''}`}
            style={{
              opacity: n.fade ? Math.max(0, 1 - n.fade / 0.55) : undefined,
              left: `${n.x}vw`,
              bottom: `${lane.bottom}vh`,
              height: `${lane.h}vh`,
              zIndex: lane.z,
            }}
            onClick={(e) => hit(n, e)}
            aria-label={n.bubble || '지나가는 학생'}
          >
            <img src={n.img} alt="" draggable="false" style={{ transform: n.dir < 0 ? 'scaleX(-1)' : undefined }} />
            {showBubble && !n.served && (
              <span className={`fg__bubble${n.type === 'refuse' ? ' is-no' : ''}`} style={{ '--t': `${n.bubbleDur}s` }}>
                {n.bubble}
              </span>
            )}
          </button>
        )
      })}

      {/* 한남이 (오른쪽 아래, 고정 이미지) */}
      <div className="fg__host">
        {say && <p className="fg__say">{say}</p>}
        <img src={hannam} alt="한남이" />
      </div>

      {/* 효과 */}
      {fx.map((f) =>
        f.kind === 'fly' ? (
          <span key={f.id} className="fg__fly" style={{ '--tx': `${f.x}px`, '--ty': `${f.y}px` }}>
            <FlyerIcon src={flyer} />
          </span>
        ) : (
          <span key={f.id} className={`fg__pop fg__pop--${f.kind}`} style={{ left: f.x, top: f.y }}>
            {f.kind === 'plus' ? '+1' : 'MISS'}
          </span>
        ),
      )}

      {/* 상단 정보 */}
      {phase !== 'intro' && (
        <div className="fg__hud">
          <span className={`fg__hud-box${pulse === 'got' ? ' is-pulse' : ''}`}>
            <FlyerIcon src={flyer} /> {s.got} / {GOAL}
          </span>
          <span className={`fg__hud-box fg__time${s.left <= 5 ? ' is-low' : ''}`}>{fmt(s.left)}</span>
          <span className={`fg__hud-box${pulse === 'miss' ? ' is-blink' : ''}`}>
            실수 {s.miss} / {MAX_MISS}
          </span>
        </div>
      )}

      {/* 안내창 */}
      {phase === 'intro' && (
        <div className="fg__panel">
          {flyer && <img className="fg__poster" src={flyer} alt="한남이 선거 홍보물" />}
          <p className="fg__kicker">MINI GAME</p>
          <h2 className="fg__title">선거 홍보물 배부</h2>
          <p className="fg__goal">
            {TIME}초 안에 홍보물 <b>{GOAL}장</b>을 전달하세요.
          </p>
          <ul className="fg__rules">
            <li>홍보물을 원하는 학생(말풍선)을 누르면 전달 성공!</li>
            <li>거절하거나 이미 받은 학생을 누르면 실수 1회</li>
            <li>말풍선 없이 지나가는 학생을 눌러도 실수 1회</li>
            <li>실수 {MAX_MISS}회 또는 시간 초과면 실패</li>
          </ul>
          <button type="button" className="fg__btn" onClick={start}>
            게임 시작
          </button>
        </div>
      )}

      {count && (
        <p key={count} className="fg__count">
          {count}
        </p>
      )}

      {/* 성공 */}
      {phase === 'clear' && (
        <>
          <div className="fg__dim" />
          <p className="fg__banner">MISSION CLEAR!</p>
          <EndTalk
            delay={1000}
            lines={['다 나눠줬네요! 정말 감사합니다. 덕분에 시간 안에 끝냈어요.']}
            buttons={[{ text: '확인', main: true, on: () => onDone('clear') }]}
          />
        </>
      )}

      {/* 실패 */}
      {phase === 'fail' && (
        <>
          <div className="fg__dim" />
          <p className="fg__banner is-fail">MISSION FAILED</p>
          {failStep > 0 && (
            <EndTalk
              lines={['생각보다 쉽지 않죠? 학생들이 워낙 바쁘게 움직여서요.', '괜찮으시면 한 번만 더 도와주시겠어요?']}
              buttons={[
                { text: '다시 도전하기', main: true, on: () => setPhase('intro') },
                { text: '그만두기', on: () => onDone('quit') },
              ]}
            />
          )}
        </>
      )}
      {/* 지금 단계 (화면 읽기 프로그램용) */}
      <span className="fg__sr" aria-live="polite">
        {phase === 'play' ? `${s.got}장 전달, 실수 ${s.miss}회, 단계 속도 ${st.speed}` : ''}
      </span>
    </div>
  )
}

// 한남이 대화창 (클릭으로 다음 줄, 마지막 줄에서 버튼)
function EndTalk({ lines, buttons, delay = 0 }) {
  const [i, setI] = useState(0)
  const [on, setOn] = useState(delay === 0)
  useEffect(() => {
    if (delay) {
      const t = setTimeout(() => setOn(true), delay)
      return () => clearTimeout(t)
    }
  }, [delay])
  if (!on) return null
  const last = i >= lines.length - 1
  return (
    <div className="fg__talk" onClick={() => !last && setI(i + 1)}>
      <span className="fg__talk-name">한남이</span>
      <p className="fg__talk-text">{lines[i]}</p>
      {last ? (
        <div className="fg__talk-btns">
          {buttons.map((b) => (
            <button
              key={b.text}
              type="button"
              className={`fg__btn${b.main ? '' : ' is-sub'}`}
              onClick={(e) => {
                e.stopPropagation()
                b.on()
              }}
            >
              {b.text}
            </button>
          ))}
        </div>
      ) : (
        <span className="fg__talk-next">▶</span>
      )}
    </div>
  )
}

function FlyerIcon({ src }) {
  if (src) return <img className="fg__flyer" src={src} alt="" />
  return (
    <svg className="fg__flyer" viewBox="0 0 24 30" aria-hidden="true">
      <rect x="1" y="1" width="22" height="28" rx="2" fill="#fff" stroke="#0225ff" strokeWidth="2" />
      <rect x="5" y="5" width="14" height="6" fill="#0225ff" />
      <rect x="5" y="14" width="14" height="2" fill="#5f8cf7" />
      <rect x="5" y="19" width="10" height="2" fill="#5f8cf7" />
      <rect x="5" y="24" width="12" height="2" fill="#5f8cf7" />
    </svg>
  )
}
