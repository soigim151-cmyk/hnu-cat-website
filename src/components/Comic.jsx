// 시작 만화 (미국 카툰 스타일, 움직이는 인터랙티브 만화)
// 화면을 누르면: 연출 중이면 바로 끝까지 → 다 나왔으면 다음 페이지. SKIP 으로 언제든 건너뛰기
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { COMIC } from '../data/comic.js'
import { playSfx, playBgm, stopBgm } from './sfx.js'
import './Comic.css'

const BASE = import.meta.env.BASE_URL
// 컷 등장 방향 (번갈아 가며)
const ENTER = [
  { x: -60, rotation: -4 },
  { y: -50, rotation: 3 },
  { x: 60, rotation: 4 },
  { y: 50, rotation: -3 },
]

export default function Comic({ onDone }) {
  const [page, setPage] = useState(0)
  const rootRef = useRef(null)
  const tlRef = useRef(null)
  const leavingRef = useRef(false)
  const pg = COMIC[page]
  const last = page === COMIC.length - 1

  // 페이지 연출
  useLayoutEffect(() => {
    leavingRef.current = false
    const q = gsap.utils.selector(rootRef)
    const tl = gsap.timeline()
    tlRef.current = tl
    const loops = [] // 계속 도는 움직임 (카메라 · 빛): 페이지 진행과 따로 → 한 번 누르면 바로 다음 페이지
    tl.fromTo(q('.cmc__page'), { opacity: 0 }, { opacity: 1, duration: 0.25 })
    q('.cmc__panel').forEach((el, i) => {
      const at = 0.15 + i * 0.75
      const from = ENTER[(page + i) % ENTER.length]
      tl.fromTo(el, { opacity: 0, scale: 0.88, ...from }, { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0, duration: 0.55, ease: 'back.out(1.6)' }, at)
      tl.call(() => playSfx('pop'), [], at)
      const p = pg.panels[i]
      const inner = el.querySelector('.cmc__art')
      // 카메라 움직임 (컷 안에서 천천히 계속)
      if (inner && p.move) {
        const mv = {
          'pan-r': [{ xPercent: -6, scale: 1.14 }, { xPercent: 6, scale: 1.14 }],
          'pan-l': [{ xPercent: 6, scale: 1.14 }, { xPercent: -6, scale: 1.14 }],
          'zoom-in': [{ scale: 1 }, { scale: 1.16 }],
          'zoom-in-slow': [{ scale: 1 }, { scale: 1.25 }],
          'zoom-out': [{ scale: 1.2 }, { scale: 1 }],
          pop: [{ scale: 0.8, rotation: -6 }, { scale: 1, rotation: 0, ease: 'elastic.out(1, 0.5)' }],
          shake: [{ scale: 1.08 }, { scale: 1.08 }],
        }[p.move]
        // 세로로 긴 그림: 위(달) → 아래(거리)로 천천히
        if (p.move === 'pan-down') {
          const img = el.querySelector('.cmc__img')
          if (img) loops.push(gsap.fromTo(img, { objectPosition: '50% 0%' }, { objectPosition: '50% 100%', duration: 7, delay: at, ease: 'sine.inOut' }))
        }
        if (mv) loops.push(gsap.fromTo(inner, mv[0], { ...mv[1], duration: p.move === 'pop' ? 1 : 7, delay: at, ease: mv[1].ease || 'sine.inOut' }))
        if (p.move === 'shake') tl.fromTo(inner, { x: -6 }, { x: 6, duration: 0.06, repeat: 9, yoyo: true, ease: 'none' }, at + 0.4)
      }
      // 번쩍이는 빛
      const burst = el.querySelector('.cmc__burst')
      if (burst) {
        tl.fromTo(burst, { scale: 0.2, opacity: 0 }, { scale: 1.3, opacity: 0.75, duration: 0.5, ease: 'power4.out' }, at + 0.2)
        tl.to(burst, { opacity: 0.28, duration: 1.2 }, at + 1.2) // 번쩍인 뒤에는 은은하게
        loops.push(gsap.to(burst, { rotation: 25, duration: 8, delay: at + 0.7, ease: 'none' }))
      }
      const white = el.querySelector('.cmc__white')
      if (white) tl.fromTo(white, { opacity: 0 }, { opacity: 1, duration: 0.12 }, at + 0.25).to(white, { opacity: 0, duration: 0.8 }, at + 0.4)
      // 고양이 → 사람 변신
      const morph = el.querySelector('.cmc__morph')
      if (morph) tl.fromTo(morph, { opacity: 0, xPercent: -50, scale: 0.6, filter: 'brightness(3)' }, { opacity: 1, xPercent: -50, scale: 1, filter: 'brightness(1)', duration: 1, ease: 'power2.out' }, at + 0.8)
      // 위에 겹친 그림
      el.querySelectorAll('.cmc__layer').forEach((ly, k) => tl.fromTo(ly, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, at + 0.25 + k * 0.15))
      // 해설 상자
      el.querySelectorAll('.cmc__cap').forEach((c, k) => tl.fromTo(c, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.35 }, at + 0.35 + k * 1.1))
      // 효과 글자 (쾅!)
      el.querySelectorAll('.cmc__sfx').forEach((s, k) => {
        const d = at + 0.45 + Number(s.dataset.delay || 0) + k * 0.15
        tl.fromTo(s, { opacity: 0, scale: 2.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, d)
        if (s.dataset.sound) tl.call(() => playSfx(s.dataset.sound), [], d)
      })
      // 말풍선
      el.querySelectorAll('.cmc__balloon').forEach((b) => {
        const d = at + 0.6 + Number(b.dataset.delay || 0)
        tl.fromTo(b, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)' }, d)
      })
      // 도장
      const stamp = el.querySelector('.cmc__stamp')
      if (stamp) tl.fromTo(stamp, { opacity: 0, scale: 3, rotation: 20 }, { opacity: 1, scale: 1, rotation: -12, duration: 0.25, ease: 'power4.in' }, at + 0.9).fromTo(el, { x: -5 }, { x: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' }, at + 1.15)
    })
    // 마지막 페이지: 출발 버튼
    const go = q('.cmc__go')
    if (go.length) tl.fromTo(go, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 })
    return () => {
      tl.kill()
      loops.forEach((t) => t.kill())
    }
  }, [page, pg])

  // 페이지별 음악
  useEffect(() => {
    if (pg.bgm) playBgm(pg.bgm, undefined, 1.2)
  }, [pg.bgm])

  const finish = useCallback(() => {
    if (leavingRef.current) return
    leavingRef.current = true
    stopBgm(0.8)
    gsap.to(rootRef.current, { opacity: 0, duration: 0.6, onComplete: onDone })
  }, [onDone])

  const next = useCallback(() => {
    if (leavingRef.current) return
    const tl = tlRef.current
    // 연출 중이면 한 번에 끝까지
    if (tl && tl.progress() < 1) {
      tl.progress(1)
      return
    }
    if (last) return
    playSfx('whoosh')
    leavingRef.current = true
    gsap.to(rootRef.current.querySelector('.cmc__page'), {
      xPercent: -8,
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(rootRef.current.querySelector('.cmc__page'), { xPercent: 0 })
        setPage((n) => n + 1)
      },
    })
  }, [last])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish()
      else if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, finish])

  return (
    <div className="cmc" ref={rootRef} onClick={next} role="dialog" aria-modal="true" aria-label="시작 만화: 한남대 고양이가 학생이 되었다">
      {/* 만화 필터 (색을 단순하게 · 선명하게) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="cmc-ink">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            <feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            <feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1" />
          </feComponentTransfer>
        </filter>
      </svg>

      <div className="cmc__page" key={page} style={{ gridTemplateAreas: pg.layout }}>
        {pg.panels.map((p, i) => (
          <Panel key={i} p={p} onGo={finish} />
        ))}
      </div>

      <div className="cmc__ui">
        <span className="cmc__count">
          {page + 1} / {COMIC.length}
        </span>
        {!last && <span className="cmc__hint">화면을 눌러 넘기기 ▶</span>}
      </div>
      <button
        type="button"
        className="cmc__skip"
        onClick={(e) => {
          e.stopPropagation()
          playSfx('select')
          finish()
        }}
      >
        SKIP ▶▶
      </button>
    </div>
  )
}

function Panel({ p, onGo }) {
  return (
    <div
      className={`cmc__panel tone-${p.tone || 'day'}${p.frameless ? ' is-frameless' : ''}`}
      // 그림 비율에 맞춘 컷 (글자 · 말풍선이 그림 위에 정확히 올라가도록)
      style={{ gridArea: p.area, ...(p.aspect ? { aspectRatio: p.aspect, width: 'auto', height: '100%', maxWidth: '100%', justifySelf: p.align || 'center', alignSelf: 'center' } : null) }}
    >
      <div className="cmc__art">
        {p.src && (
          <img
            className={`cmc__img${p.fit === 'contain' || p.frameless ? ' is-contain' : ''}`}
            src={BASE + p.src}
            alt=""
            draggable="false"
            style={p.pos ? { objectPosition: p.pos } : undefined}
          />
        )}
        {p.cctv && (
          <div className="cmc__cctv">
            {p.cctv.map((s, k) => (
              <div key={k} className="cmc__cam">
                <img src={BASE + s} alt="" />
                <span>CAM {k + 1}</span>
              </div>
            ))}
          </div>
        )}
        {p.doc && (
          <div className="cmc__doc">
            <p className="cmc__doc-title">입학 허가서</p>
            <p>성명: ○○○ (고양이)</p>
            <p>학과: 자유전공</p>
            <p>위 학생의 입학을 허가함.</p>
            <span className="cmc__stamp">입학 허가</span>
          </div>
        )}
        {p.title && (
          <div className="cmc__title">
            <img src={`${BASE}images/Main_Title_v2.png`} alt="한남대 고양이가 학생이 되었다!" />
          </div>
        )}
        {p.layers?.map((l, k) => (
          <img key={k} className={`cmc__layer ${l.cls || ''}`} src={BASE + l.src} alt="" style={l.style} draggable="false" />
        ))}
        {p.morph && <img className="cmc__morph" src={BASE + p.morph.to} alt="" style={p.morph.style} draggable="false" />}
        {p.moon && <span className="cmc__moon" />}
        {p.sun && <span className="cmc__sun" />}
        {p.pigeon && <Pigeon />}
        {p.keyring && <Keyring />}
      </div>
      {p.tone === 'night' && <span className="cmc__night" />}
      {p.tone === 'cctv' && <span className="cmc__scan" />}
      {p.tone !== 'art' && <span className="cmc__dots" />}
      {p.speed && <span className="cmc__speed" />}
      {p.burst && <span className="cmc__burst" />}
      {p.burst && <span className="cmc__white" />}
      {p.sparkle && <span className="cmc__sparkle">✦ ✧ ✦</span>}
      {p.tone === 'cctv' && <span className="cmc__rec">● REC</span>}

      {p.caption && <Caption c={p.caption} />}
      {p.caption2 && <Caption c={p.caption2} />}
      {p.sfx?.map((s, k) => (
        <span
          key={k}
          className={`cmc__sfx c-${s.color}`}
          data-delay={s.delay || 0}
          data-sound={s.sound || ''}
          style={{ left: `${s.x}%`, top: `${s.y}%`, '--rot': `${s.rot}deg`, '--sz': s.size }}
        >
          <span>{s.t}</span>
        </span>
      ))}
      {p.balloons?.map((b, k) => (
        <span
          key={k}
          className={`cmc__balloon tail-${b.tail}${b.thought ? ' is-thought' : ''}`}
          data-delay={b.delay || 0}
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
        >
          {b.t}
        </span>
      ))}
      {p.title && (
        <button
          type="button"
          className="cmc__go"
          onClick={(e) => {
            e.stopPropagation()
            playSfx('select')
            onGo()
          }}
        >
          캠퍼스로 출발! →
        </button>
      )}
    </div>
  )
}

function Caption({ c }) {
  return <p className={`cmc__cap pos-${c.pos}${c.big ? ' is-big' : ''}`}>{c.text}</p>
}

// 비둘기 (간단한 그림, 고개를 까딱까딱)
function Pigeon() {
  return (
    <svg className="cmc__pigeon" viewBox="0 0 120 90" aria-hidden="true">
      <g className="cmc__pigeon-body">
        <ellipse cx="62" cy="58" rx="38" ry="22" fill="#8d97ad" stroke="#111" strokeWidth="4" />
        <path d="M30 58 L4 50 L12 66 Z" fill="#6f7891" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <g className="cmc__pigeon-head">
          <circle cx="94" cy="34" r="15" fill="#9aa4bb" stroke="#111" strokeWidth="4" />
          <circle cx="98" cy="31" r="3" fill="#111" />
          <path d="M108 35 L118 38 L108 41 Z" fill="#f2b14a" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
          <path d="M82 44 Q92 52 104 44" fill="none" stroke="#3fae8f" strokeWidth="5" />
        </g>
        <path d="M56 80 L52 88 M70 80 L74 88" stroke="#e98a5a" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// 흔들리는 키링
function Keyring() {
  return (
    <svg className="cmc__keyring" viewBox="0 0 60 140" aria-hidden="true">
      <line x1="30" y1="0" x2="30" y2="70" stroke="#111" strokeWidth="4" />
      <circle cx="30" cy="74" r="8" fill="none" stroke="#111" strokeWidth="4" />
      <g transform="translate(30 108)">
        <circle r="26" fill="#ffd23f" stroke="#111" strokeWidth="4" />
        <path d="M-12 -14 L-6 -26 L0 -14 L6 -26 L12 -14" fill="#ffd23f" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="-8" cy="-2" r="3" fill="#111" />
        <circle cx="8" cy="-2" r="3" fill="#111" />
        <path d="M-6 8 Q0 13 6 8" fill="none" stroke="#111" strokeWidth="3" />
      </g>
    </svg>
  )
}
