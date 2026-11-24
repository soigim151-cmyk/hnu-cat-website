// 시작 만화 (미국 카툰 스타일, 움직이는 인터랙티브 만화)
// 한 컷씩: 컷이 나오고 → 그 컷만 움직이고 → 멈춘 뒤 다음 컷 (여러 컷이 동시에 움직이지 않음)
// 화면을 누르면: 연출 중이면 바로 끝까지 → 다 나왔으면 다음 페이지. SKIP 으로 언제든 건너뛰기
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { COMIC } from '../data/comic.js'
import { playSfx, playBgm, stopBgm } from './sfx.js'
import './Comic.css'

const BASE = import.meta.env.BASE_URL
const HOLD = 2.2 // 한 컷이 움직이는 시간 (초)

// 컷 안 카메라 움직임 (한 번만, HOLD 동안)
const MOVES = {
  'pan-r': [{ xPercent: -4, scale: 1.1 }, { xPercent: 4, scale: 1.1 }],
  'pan-l': [{ xPercent: 4, scale: 1.1 }, { xPercent: -4, scale: 1.1 }],
  'zoom-in': [{ scale: 1 }, { scale: 1.08 }],
  'zoom-out': [{ scale: 1.12 }, { scale: 1 }],
  pop: [{ scale: 0.85, rotation: -4 }, { scale: 1, rotation: 0, ease: 'back.out(2)' }],
  shake: [{ scale: 1.06 }, { scale: 1.06 }], // 흔들 때 가장자리가 비지 않게 살짝 확대
}

export default function Comic({ onDone }) {
  const [page, setPage] = useState(0)
  const rootRef = useRef(null)
  const tlRef = useRef(null)
  const leavingRef = useRef(false)
  const pg = COMIC[page]
  const last = page === COMIC.length - 1

  const goNext = useRef(null)

  // ── 페이지 연출 ──
  useLayoutEffect(() => {
    leavingRef.current = false
    const q = gsap.utils.selector(rootRef)
    const tl = gsap.timeline()
    tlRef.current = tl

    // 세로로 긴 밤 장면: 화면을 꽉 채우고 위에서 아래로 → 바닥의 고양이 → 암전 → 다음 페이지
    if (pg.kind === 'scroll') {
      const tall = q('.cmc__tall')[0]
      const dist = () => Math.max(0, tall.offsetHeight - window.innerHeight)
      tl.fromTo(q('.cmc__scroll'), { opacity: 0 }, { opacity: 1, duration: 0.8 })
      tl.fromTo(tall, { y: 0 }, { y: () => -dist(), duration: pg.duration ?? 8, ease: 'sine.inOut' }, 0.3)
      q('.cmc__line').forEach((el) => {
        const at = Number(el.dataset.at)
        tl.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' }, at)
        if (el.dataset.out) tl.to(el, { opacity: 0, duration: 0.8 }, Number(el.dataset.out))
      })
      tl.fromTo(q('.cmc__floorcat'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, (pg.duration ?? 8) - 1.2)
      tl.to(q('.cmc__black'), { opacity: 1, duration: 1.4, ease: 'power1.in' }, '+=1.6')
      tl.call(() => goNext.current?.(true))
      return () => tl.kill()
    }

    tl.fromTo(q('.cmc__page'), { opacity: 0 }, { opacity: 1, duration: 0.3 })
    let cursor = 0.3
    q('.cmc__panel').forEach((el, i) => {
      const p = pg.panels[i]
      const at = cursor
      const hold = p.hold ?? HOLD
      const inner = el.querySelector('.cmc__art')

      // 컷 등장 (조용히): CCTV 화면 안에서 빠져나오는 컷은 확대된 상태에서 시작
      if (p.fromMonitor) {
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 }, at)
        // 그림만 확대 → 원래 크기로 (컷 밖으로는 넘치지 않음)
        tl.fromTo(el.querySelectorAll('.cmc__art, .cmc__onscreen'), { scale: p.fromMonitor.scale ?? 4, transformOrigin: p.fromMonitor.origin }, { scale: 1, duration: 1.6, ease: 'power3.inOut' }, at)
        tl.fromTo(el.querySelector('.cmc__onscreen'), { opacity: 1 }, { opacity: 0, duration: 0.9, ease: 'power1.in' }, at + 0.2)
      } else {
        tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, at)
      }
      tl.call(() => playSfx('pop'), [], at)
      const t0 = at + (p.fromMonitor ? 1.6 : 0.3)

      // 이 컷만 움직임 (HOLD 동안 한 번)
      const mv = MOVES[p.move]
      if (inner && mv) tl.fromTo(inner, mv[0], { ...mv[1], duration: p.move === 'pop' ? 0.8 : hold, ease: mv[1].ease || 'sine.inOut' }, at)
      if (inner && p.move === 'shake') tl.fromTo(inner, { x: -5 }, { x: 5, duration: 0.06, repeat: 7, yoyo: true, ease: 'none', clearProps: 'x' }, at + 0.4)
      // 번쩍
      const burst = el.querySelector('.cmc__burst')
      if (burst) tl.fromTo(burst, { scale: 0.2, opacity: 0 }, { scale: 1.3, opacity: 0.7, duration: 0.5, ease: 'power4.out' }, at + 0.3).to(burst, { opacity: 0.2, rotation: 15, duration: 1.4 }, at + 0.9)
      const white = el.querySelector('.cmc__white')
      if (white) tl.fromTo(white, { opacity: 0 }, { opacity: 1, duration: 0.1 }, at + 0.3).to(white, { opacity: 0, duration: 0.7 }, at + 0.45)
      // 해설 · 효과 글자 · 말풍선: 컷이 자리 잡은 뒤 차례로
      el.querySelectorAll('.cmc__cap').forEach((c, k) => tl.fromTo(c, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4 }, t0 + k * 0.9))
      el.querySelectorAll('.cmc__sfx').forEach((s, k) => {
        const d = t0 + 0.2 + Number(s.dataset.delay || 0) + k * 0.2
        tl.fromTo(s, { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)' }, d)
        if (s.dataset.sound) tl.call(() => playSfx(s.dataset.sound), [], d)
      })
      el.querySelectorAll('.cmc__balloon').forEach((b) => {
        const d = t0 + 0.4 + Number(b.dataset.delay || 0)
        tl.fromTo(b, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, d)
      })
      const stamp = el.querySelector('.cmc__stamp')
      if (stamp) tl.fromTo(stamp, { opacity: 0, scale: 3, rotation: 20 }, { opacity: 1, scale: 1, rotation: -12, duration: 0.25, ease: 'power4.in' }, t0 + 0.6)
      // 다음 컷은 이 컷의 움직임이 끝난 뒤
      cursor = Math.max(at + hold, tl.duration()) + 0.25
    })
    const go = q('.cmc__go')
    if (go.length) tl.fromTo(go, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 })
    return () => tl.kill()
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

  const turn = useCallback(
    (quiet) => {
      if (leavingRef.current || last) return
      leavingRef.current = true
      const el = rootRef.current.querySelector('.cmc__page, .cmc__scroll')
      if (quiet) return setPage((n) => n + 1) // 암전에서 바로 다음 페이지로
      playSfx('whoosh')
      gsap.to(el, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => setPage((n) => n + 1) })
    },
    [last],
  )
  useEffect(() => {
    goNext.current = turn
  }, [turn])

  const next = useCallback(() => {
    if (leavingRef.current) return
    const tl = tlRef.current
    // 연출 중이면 한 번에 끝까지 (밤 장면은 끝나면 스스로 넘어감)
    if (tl && tl.progress() < 1) {
      tl.progress(1)
      return
    }
    turn(false)
  }, [turn])

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
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="cmc-ink">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            <feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            <feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1" />
          </feComponentTransfer>
        </filter>
      </svg>

      {pg.kind === 'scroll' ? (
        <ScrollScene key={page} pg={pg} />
      ) : (
        <div className="cmc__page" key={page} style={{ gridTemplateAreas: pg.layout }}>
          {pg.panels.map((p, i) => (
            <Panel key={i} p={p} onGo={finish} />
          ))}
        </div>
      )}

      <div className="cmc__ui">
        <span className="cmc__count">
          {page + 1} / {COMIC.length}
        </span>
        {!last && pg.kind !== 'scroll' && <span className="cmc__hint">화면을 눌러 넘기기 ▶</span>}
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

// 화면을 꽉 채운 세로 그림: 위에서 아래로 내려가며 글이 하나씩
function ScrollScene({ pg }) {
  return (
    <div className="cmc__scroll">
      <div className="cmc__tall" style={{ aspectRatio: pg.aspect }}>
        <img className="cmc__tall-img" src={BASE + pg.src} alt="" draggable="false" />
        {pg.floor && <img className="cmc__floorcat" src={BASE + pg.floor.src} alt="" style={pg.floor.style} draggable="false" />}
      </div>
      {pg.lines.map((l, k) => (
        <p key={k} className={`cmc__line pos-${l.pos || 'top'}${l.big ? ' is-big' : ''}`} data-at={l.at} data-out={l.out ?? ''}>
          {l.text}
        </p>
      ))}
      <span className="cmc__black" />
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
      {/* 그림과 효과는 컷 안에만 (글자 · 말풍선은 컷 밖으로 나갈 수 있음) */}
      <div className="cmc__clip">
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
          {p.sun && <span className="cmc__sun" />}
          {p.pigeon && <Pigeon />}
          {p.keyring && <Keyring />}
        </div>
        {/* CCTV 화면 속에 비치던 앞 장면 (확대된 화면에서 빠져나올 때 사라짐) */}
        {p.fromMonitor && <img className="cmc__onscreen" src={BASE + p.fromMonitor.img} alt="" />}
        {p.tone === 'night' && <span className="cmc__night" />}
        {p.tone !== 'art' && p.tone !== 'plain' && <span className="cmc__dots" />}
        {p.speed && <span className="cmc__speed" />}
        {p.burst && <span className="cmc__burst" />}
        {p.burst && <span className="cmc__white" />}
        {p.sparkle && <span className="cmc__sparkle">✦ ✧ ✦</span>}
      </div>

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
          style={{ left: `${b.x}%`, top: `${b.y}%`, ...(b.w ? { width: b.w } : null) }}
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
