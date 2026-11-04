import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import './StartPage.css'
import { VIEW_MODE } from '../components/viewMode.js'

// Figma 프레임(1440 × 1014) 기준 좌표입니다. 단위는 Figma px.
// 화면 크기에 맞춰 CSS 변수 --u 로 한꺼번에 확대·축소됩니다.
// BASE_URL: 로컬에선 '/', GitHub Pages에선 '/hnu-cat-website/'
const IMG = `${import.meta.env.BASE_URL}images`

// 타이틀 화면 장식 (디자이너 시안 기준, Figma 1440 × 1014 좌표)
// - x, y, w: 위치·폭 / rot: 기울기(도)
// - from: 튀어 들어오는 방향 ('pop' = 제자리에서 톡 튀어나옴, 'left'·'right'·'top'·'bottom' = 화면 밖에서 날아옴)
// - float: 들어온 뒤 살짝 둥둥 떠 있을지
// 배열 순서 = 겹치는 순서 (뒤 → 앞), 등장 순서
const S2 = `${IMG}/start2`
const DECO = [
  { src: 'halftone', x: 574, y: 245, w: 534, rot: 0, from: 'fade' },
  // 띠: 길게 늘려서 양 끝이 화면 밖으로 나가게 (끊겨 보이지 않도록)
  { src: 'tape-check-long', x: -900, y: -10, w: 2600, rot: -10, from: 'top' },
  { src: 'tape-white-long', x: -1000, y: 700, w: 2200, rot: 30, from: 'left' },
  { src: 'tape-blue-long', x: 380, y: 640, w: 2100, rot: -20, from: 'right' },
  { src: 'burst', x: -95, y: 570, w: 507, rot: 0, from: 'pop', float: true },
  { src: 'burst-check', x: -9, y: 213, w: 432, rot: 0, from: 'pop', float: true },
  { src: 'cat-face', x: 255, y: 160, w: 149, rot: 0, from: 'pop', float: true },
  { src: 'hnu', x: 582, y: 241, w: 267, rot: 0, from: 'pop' },
  { src: 'star-white', x: 1189, y: 236, w: 210, rot: 0, from: 'pop', float: true },
  { src: 'star-paw', x: 1100, y: 178, w: 170, rot: 0, from: 'pop', float: true },
  { src: 'id-card', x: 890, y: 770, w: 560, rot: 0, from: 'bottom' },
  { src: 'star-yellow', x: 1205, y: 793, w: 89, rot: 0, from: 'pop', float: true },
  { src: 'star-blue', x: 1276, y: 819, w: 120, rot: 0, from: 'pop', float: true },
]
const decoSrc = (d) => (d.src === 'star-white' ? `${IMG}/deco/star-big.png` : `${S2}/${d.src}.webp`)

// 위치값을 CSS 변수로 넘기는 헬퍼
const pos = ({ x, y, w }) => ({ '--x': x, '--y': y, '--w': w })

// 정문 들어가기 설정
const GATE = {
  zoom: 3, // 정문이 다가오는 정도 (확대 배율)
  wheelDistance: 800, // 정문을 다 지나는 데 필요한 휠 양 (px)
  touchDistance: 380, // 휴대폰에서 필요한 쓸어 올리기 거리 (px)
}
const TITLE_HOLD = 7000 // ms: 정문을 지난 뒤 타이틀·장식을 보여주는 시간
const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function StartPage({ onEnterCampus }) {
  const rootRef = useRef(null)
  const titleRef = useRef(null)
  const leavingRef = useRef(false) // 중복 클릭 방지
  const gateRef = useRef(null)
  const contentRef = useRef(null)
  const hintRef = useRef(null)
  const [entered, setEntered] = useState(false) // 정문을 다 지났는지
  const handleEnterRef = useRef(null)

  // ── 정문 들어가기: 휠(터치·키보드)로 정문이 다가오며 사라지고, 안쪽 화면이 나타남 ──
  useLayoutEffect(() => {
    const reduce = prefersReducedMotion()
    const gate = gateRef.current
    const tl = gsap.timeline({ paused: true })
    // 1) 정문이 다가오며 완전히 사라진 다음 (0 ~ 0.7)
    // 2) 안쪽(격자 배경 + 타이틀)이 나타남 (0.72 ~ 1)  ← 두 구간이 겹치지 않게
    tl.fromTo(gate, { scale: 1 }, { scale: GATE.zoom, ease: 'power2.in', duration: 0.6 }, 0)
      .to(gate, { opacity: 0, ease: 'power1.in', duration: 0.25 }, 0.35)
      .fromTo(
        contentRef.current,
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'power2.out', duration: 0.36 },
        0.62,
      )
      .to(hintRef.current, { opacity: 0, duration: 0.08 }, 0)

    const state = { p: 0 }
    let target = 0
    let done = false
    const follow = gsap.quickTo(state, 'p', {
      duration: reduce ? 0.3 : 0.6,
      ease: 'power3.out',
      onUpdate: () => {
        tl.progress(state.p)
        if (state.p > 0.97 && popRef.current && !popRef.current.isActive() && popRef.current.progress() === 0) popRef.current.play()
        gate.style.visibility = state.p > 0.995 ? 'hidden' : 'visible'
      },
    })
    const advance = (delta) => {
      if (done) return
      target = Math.min(1, Math.max(0, target + (reduce && delta > 0 ? 1 : delta)))
      if (target >= 0.6) target = 1 // 정문이 사라지면 나머지(타이틀 등장)는 스크롤을 멈춰도 자동으로
      follow(target)
      if (target >= 1) {
        done = true
        setEntered(true)
      }
    }

    const onWheel = (e) => {
      if (done) return
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
      advance((e.deltaY * unit) / GATE.wheelDistance)
    }
    let lastY = null
    const onTouchStart = (e) => (lastY = e.touches[0].clientY)
    const onTouchMove = (e) => {
      if (done || lastY === null) return
      const y = e.touches[0].clientY
      advance((lastY - y) / GATE.touchDistance) // 위로 쓸어 올리면 앞으로
      lastY = y
    }
    const onKey = (e) => {
      if (done) return
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        advance(0.25)
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        advance(-0.25)
      }
    }

    const root = rootRef.current
    root.addEventListener('wheel', onWheel, { passive: false })
    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      root.removeEventListener('wheel', onWheel)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      tl.kill()
    }
  }, [])

  // ── 장식이 튀어 들어오기: 정문을 절반쯤 지나면 시작 ──────
  const popRef = useRef(null)
  useLayoutEffect(() => {
    const reduce = prefersReducedMotion()
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray('.start__pop')
      const tl = gsap.timeline({ paused: true })
      els.forEach((el, i) => {
        const d = DECO[i]
        gsap.set(el, { rotation: d.rot, transformOrigin: '50% 50%' })
        const at = 0.08 * i
        if (reduce || d.from === 'fade') {
          tl.from(el, { opacity: 0, duration: 0.6, ease: 'power2.out' }, at)
        } else if (d.from === 'pop') {
          tl.from(el, { scale: 0, opacity: 0, rotation: d.rot - 35, duration: 0.7, ease: 'back.out(2.6)' }, at)
        } else {
          const off = { left: { xPercent: -120 }, right: { xPercent: 120 }, top: { yPercent: -320 }, bottom: { yPercent: 160 } }[d.from]
          tl.from(el, { ...off, rotation: d.rot + (d.from === 'right' ? 18 : -18), duration: 0.75, ease: 'back.out(1.6)' }, at)
        }
        // 들어온 뒤 살짝 둥둥
        if (d.float && !reduce) {
          tl.to(el, { y: i % 2 ? -8 : 8, rotation: d.rot + (i % 2 ? 4 : -4), duration: 2.2 + (i % 3) * 0.4, ease: 'sine.inOut', repeat: -1, yoyo: true }, at + 0.7)
        }
      })
      popRef.current = tl
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // ── 캠퍼스 페이지와 3D 모델을 미리 받아두기 ──────────
  // 시작 화면을 보는 동안 백그라운드에서 다운로드합니다.
  useEffect(() => {
    const t = setTimeout(() => {
      if (VIEW_MODE === 'map') import('../components/mapAssets.js').then((m) => m.loadMapAssets())
      else import('../components/campusModel.js').then((m) => m.preloadCampus())
    }, 1200)
    return () => clearTimeout(t)
  }, [])

  // ── 정문을 다 지나면 타이틀을 잠깐 보여준 뒤 자동으로 캠퍼스로 ──
  useEffect(() => {
    if (!entered) return
    const t = setTimeout(() => handleEnterRef.current(), TITLE_HOLD)
    return () => clearTimeout(t)
  }, [entered])

  // ── 캠퍼스로: 퇴장 애니메이션 후 페이지 전환 ────────
  const handleEnter = () => {
    if (leavingRef.current) return
    leavingRef.current = true

    const q = gsap.utils.selector(rootRef)
    const d = prefersReducedMotion() ? 0.2 : 0.5
    gsap
      .timeline({ defaults: { duration: d, ease: 'power2.inOut' }, onComplete: onEnterCampus })
      .to(titleRef.current, { opacity: 0, scale: 1.05, overwrite: 'auto' }, 0)
      .to(q('.start__sub, .start__deco, .start__bg'), { opacity: 0 }, 0)
  }
  useEffect(() => {
    handleEnterRef.current = handleEnter
  })

  return (
    <main className="start" ref={rootRef}>
      <div className="start__stage">
        {/* 배경: 격자 */}
        <div className="start__bg" aria-hidden="true">
          <img className="start__layer" src={`${IMG}/Grid.png`} alt="" style={pos({ x: 60, y: 72, w: 1323 })} />
        </div>

        {/* 정문을 지나면 나타나는 안쪽 화면 (장식 + 타이틀) */}
        <div className="start__content" ref={contentRef}>
        <div className="start__content-inner">
        {/* 장식: 시안대로 배치, 정문을 지나면 하나씩 튀어 들어옴 */}
        <div className="start__deco" aria-hidden="true">
          {DECO.map((d) => (
            <img key={d.src} className="start__layer start__pop" src={decoSrc(d)} alt="" style={pos(d)} />
          ))}
        </div>

        {/* 타이틀 */}
        <h1 className="start__title-wrap">
          <img
            ref={titleRef}
            className="start__layer start__title"
            src={`${IMG}/Main_Title_v2.png`}
            alt="한남대 고양이가 학생이 되었다."
            style={pos({ x: 230, y: 322, w: 985 })}
          />
        </h1>
        <img
          className="start__layer start__sub"
          src={`${IMG}/sub_Title.png`}
          alt="The cat at Hannam University became a student."
          style={pos({ x: 536, y: 749, w: 361 })}
        />
        </div>
        </div>

      </div>

      {/* 정문: 맨 앞에서 시작해 휠을 내리면 다가오며 사라짐 */}
      <div className="start__gate-wrap" aria-hidden="true">
        <img ref={gateRef} className="start__gate" src={`${IMG}/gate_v2.webp`} alt="" />
      </div>
      <p className="start__hint" ref={hintRef}>
        {IS_TOUCH ? '위로 밀어서 정문으로 들어가기' : '스크롤해서 정문으로 들어가기'}
      </p>
    </main>
  )
}

