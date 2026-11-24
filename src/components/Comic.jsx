// 시작 만화 (미국 카툰 스타일) — 웹툰처럼 화면을 꽉 채우고 자동으로 아래로 내려가며 보여줌
// 블록(컷)마다 멈춰서 글자 · 효과음 · 말풍선이 나오고, 잠시 뒤 다음 블록으로
// 화면을 누르면 다음 블록으로 바로. SKIP 으로 언제든 건너뛰기
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { STRIP } from '../data/comic.js'
import { playSfx, playBgm, stopBgm } from './sfx.js'
import './Comic.css'

const BASE = import.meta.env.BASE_URL
const isBeat = (b) => b.type !== 'space' || b.beat

export default function Comic({ onDone }) {
  const rootRef = useRef(null)
  const stripRef = useRef(null)
  const blockRefs = useRef([])
  const tlRef = useRef(null)
  const labelsRef = useRef([])
  const leavingRef = useRef(false)
  const [size, setSize] = useState(() => `${window.innerWidth}x${window.innerHeight}`)
  const [ended, setEnded] = useState(false)

  // 화면 크기가 바뀌면 위치를 다시 계산
  useEffect(() => {
    const onResize = () => setSize(`${window.innerWidth}x${window.innerHeight}`)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── 전체 연출 (스크롤 + 블록별 등장) ──
  useLayoutEffect(() => {
    const strip = stripRef.current
    const vh = window.innerHeight
    const maxY = Math.max(0, strip.offsetHeight - vh)
    const clampY = (y) => Math.min(maxY, Math.max(0, y))
    const tl = gsap.timeline({ onComplete: () => setEnded(true) })
    tlRef.current = tl
    labelsRef.current = []
    let cur = 0
    gsap.set(strip, { y: 0 })
    tl.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 })

    const scrollTo = (y) => {
      const d = Math.abs(y - cur)
      if (d > 2) tl.to(strip, { y: -y, duration: Math.min(2.4, Math.max(0.8, d / 520)), ease: 'power2.inOut' })
      cur = y
    }

    STRIP.forEach((b, i) => {
      if (!isBeat(b)) return
      const el = blockRefs.current[i]
      if (!el) return
      const top = el.offsetTop
      const h = el.offsetHeight
      const label = `b${i}`
      tl.addLabel(label)
      labelsRef.current.push(label)
      const bgm = b.bgm || b.page?.bgm
      if (bgm) tl.call(() => playBgm(bgm, undefined, 1.2))

      if (b.pan && h > vh) {
        // 긴 그림: 맨 위로 간 뒤 천천히 끝까지
        scrollTo(clampY(top))
        const start = tl.duration()
        tl.to(strip, { y: -clampY(top + h - vh), duration: b.pan, ease: 'sine.inOut' })
        cur = clampY(top + h - vh)
        const lines = rootRef.current.querySelectorAll(`.cmc__line[data-block="${i}"]`)
        lines.forEach((ln, k, all) => {
          const at = start + Number(ln.dataset.at) * b.pan
          tl.fromTo(ln, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1 }, at)
          if (k < all.length - 1) tl.to(ln, { opacity: 0, duration: 0.8 }, start + Number(all[k + 1].dataset.at) * b.pan - 0.9)
        })
        const cat = el.querySelector('.cmc__floorcat')
        if (cat) tl.fromTo(cat, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1 }, start + b.pan - 1.2)
        tl.to({}, { duration: b.hold ?? 1.5 })
        tl.to(lines, { opacity: 0, duration: 0.8 })
        return
      }

      // 블록을 화면 가운데로 (화면보다 크면 위쪽에 맞춤)
      scrollTo(clampY(h < vh ? top + h / 2 - vh / 2 : top))
      const t0 = tl.duration()

      // 컷 등장
      if (b.type === 'page') {
        el.querySelectorAll('.cmc__panel').forEach((pn, k) => {
          tl.fromTo(pn, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45 }, t0 + k * 1.1)
          tl.call(() => playSfx('pop'), [], t0 + k * 1.1)
          revealIn(tl, pn, t0 + k * 1.1 + 0.4)
        })
      } else {
        const art = el.querySelectorAll('.wb__art, .cmc__onscreen')
        if (b.fromMonitor) {
          // CCTV 화면 속(앞 장면)에서 빠져나오며 방 전체가 보임
          tl.fromTo(art, { scale: b.fromMonitor.scale ?? 4, transformOrigin: b.fromMonitor.origin }, { scale: 1, duration: 1.6, ease: 'power3.inOut' }, t0)
          tl.fromTo(el.querySelector('.cmc__onscreen'), { opacity: 1 }, { opacity: 0, duration: 0.9 }, t0 + 0.2)
        }
        if (b.flash) {
          tl.fromTo(el.querySelector('.cmc__white'), { opacity: 0 }, { opacity: 0.9, duration: 0.1 }, t0 + 0.1).to(el.querySelector('.cmc__white'), { opacity: 0, duration: 0.8 }, t0 + 0.25)
        }
        if (b.shake) tl.fromTo(el.querySelector('.wb__art'), { x: -5 }, { x: 5, duration: 0.06, repeat: 7, yoyo: true, ease: 'none', clearProps: 'x' }, t0 + 0.2)
        revealIn(tl, el, t0 + (b.fromMonitor ? 1.5 : 0.2))
      }
      tl.to({}, { duration: b.hold ?? 1.3 })
    })
    return () => tl.kill()
  }, [size])

  const finish = useCallback(() => {
    if (leavingRef.current) return
    leavingRef.current = true
    stopBgm(0.8)
    gsap.to(rootRef.current, { opacity: 0, duration: 0.6, onComplete: onDone })
  }, [onDone])

  // 누르면: 다음 블록으로 바로
  const next = useCallback(() => {
    const tl = tlRef.current
    if (!tl || leavingRef.current) return
    const now = tl.time()
    const nextLabel = labelsRef.current.find((l) => tl.labels[l] > now + 0.05)
    if (nextLabel) {
      playSfx('tick')
      tl.seek(nextLabel)
    } else tl.progress(1)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish()
      else if ([' ', 'Enter', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, finish])

  return (
    <div className="cmc is-strip" ref={rootRef} onClick={next} role="dialog" aria-modal="true" aria-label="시작 만화: 한남대 고양이가 학생이 되었다">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="cmc-ink">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            <feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            <feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1" />
          </feComponentTransfer>
        </filter>
      </svg>

      <div className="cmc__strip" ref={stripRef}>
        {STRIP.map((b, i) => (
          <Block key={i} b={b} refFn={(el) => (blockRefs.current[i] = el)} onGo={finish} />
        ))}
      </div>

      {/* 긴 그림 위에 고정된 글 (그림이 내려가도 화면 위 같은 자리) */}
      {STRIP.map((b, i) =>
        b.lines?.map((l, k) => (
          <p key={`${i}-${k}`} className={`cmc__line${l.big ? ' is-big' : ''}`} data-block={i} data-at={l.at}>
            {l.text}
          </p>
        )),
      )}
      {!ended && <span className="cmc__hint cmc__hint--strip">화면을 누르면 다음 장면으로 ▼</span>}
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

// 블록 안의 글자 · 효과음 · 말풍선 · 도장을 차례로
function revealIn(tl, root, t) {
  root.querySelectorAll('.cmc__cap, .cmc__sfx, .cmc__balloon, .cmc__stamp').forEach((el, k) => {
    const d = t + k * 0.35 + Number(el.dataset.delay || 0)
    if (el.classList.contains('cmc__stamp')) tl.fromTo(el, { opacity: 0, scale: 3, rotation: 20 }, { opacity: 1, scale: 1, rotation: -12, duration: 0.25, ease: 'power4.in' }, d)
    else if (el.classList.contains('cmc__sfx')) tl.fromTo(el, { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)' }, d)
    else tl.fromTo(el, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, d)
    if (el.dataset.sound) tl.call(() => playSfx(el.dataset.sound), [], d)
  })
}

// 블록 하나
function Block({ b, refFn, onGo }) {
  const style = { background: b.bg }
  if (b.type === 'space') return <div ref={refFn} className="wb wb--space" style={{ ...style, height: `${b.h}vh` }} />
  if (b.type === 'text')
    return (
      <div ref={refFn} className={`wb wb--text is-${b.tone || 'light'} align-${b.align || 'center'}`} style={style}>
        <p>{b.text}</p>
      </div>
    )
  if (b.type === 'page')
    return (
      <div ref={refFn} className="wb wb--page" style={style}>
        <div className="cmc__page" style={{ gridTemplateAreas: b.page.layout }}>
          {b.page.panels.map((p, k) => (
            <Panel key={k} p={p} onGo={onGo} />
          ))}
        </div>
      </div>
    )
  if (b.type === 'row')
    return (
      <div ref={refFn} className="wb wb--row" style={style}>
        {b.items.map((it, k) => (
          <div key={k} className="wb__cell" style={{ flex: it.grow }}>
            <Art it={it} />
          </div>
        ))}
      </div>
    )
  return (
    <div ref={refFn} className={`wb wb--img align-${b.align || 'center'}`} style={style}>
      <div className="wb__frame" style={{ width: `${b.w ?? 100}%` }}>
        <Art it={b} />
      </div>
    </div>
  )
}

// 그림 + 위에 얹는 것들 (위치는 그림 기준 %)
function Art({ it }) {
  return (
    <div className="wb__pic" style={{ aspectRatio: it.aspect }}>
      <div className="wb__clip">
        <div className="wb__art">
          <img src={BASE + it.src} alt="" draggable="false" />
          {it.floor && <img className="cmc__floorcat" src={BASE + it.floor.src} alt="" style={it.floor.style} draggable="false" />}
        </div>
        {it.fromMonitor && <img className="cmc__onscreen" src={BASE + it.fromMonitor.img} alt="" />}
        {it.flash && <span className="cmc__white" />}
      </div>
      {it.sfx?.map((s, k) => (
        <span
          key={k}
          className={`cmc__sfx t-${s.tone || 'cream'}`}
          data-delay={s.delay || 0}
          data-sound={s.sound || ''}
          style={{ left: `${s.x}%`, top: `${s.y}%`, '--rot': `${s.rot}deg`, '--sz': s.size }}
        >
          <span>{s.t}</span>
        </span>
      ))}
      {it.balloons?.map((bl, k) => (
        <span key={k} className={`cmc__balloon tail-${bl.tail}`} data-delay={bl.delay || 0} style={{ left: `${bl.x}%`, top: `${bl.y}%` }}>
          {bl.t}
        </span>
      ))}
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
