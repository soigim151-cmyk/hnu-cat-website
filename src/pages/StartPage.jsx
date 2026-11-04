import { useEffect, useLayoutEffect, useRef } from 'react'
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

const AUTO_ENTER = 6000 // ms: 아무 조작이 없으면 이 시간 뒤 자동으로 캠퍼스로
const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function StartPage({ onEnterCampus }) {
  const rootRef = useRef(null)
  const titleRef = useRef(null)
  const leavingRef = useRef(false) // 중복 클릭 방지
  const handleEnterRef = useRef(null)

  // ── 들어가기: 휠을 내리거나, 화면을 누르거나, 위로 쓸어 올리거나, 키를 누르면 캠퍼스로 ──
  useEffect(() => {
    const go = () => handleEnterRef.current?.()
    const root = rootRef.current
    const onWheel = (e) => {
      e.preventDefault()
      if (e.deltaY > 20) go()
    }
    let startY = null
    const onTouchStart = (e) => (startY = e.touches[0].clientY)
    const onTouchMove = (e) => {
      if (startY !== null && startY - e.touches[0].clientY > 60) go()
    }
    const onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        go()
      }
    }
    // 장식이 다 들어온 뒤부터 입력을 받음 (실수로 바로 넘어가지 않게)
    const arm = setTimeout(() => {
      root.addEventListener('wheel', onWheel, { passive: false })
      root.addEventListener('click', go)
      root.addEventListener('touchstart', onTouchStart, { passive: true })
      root.addEventListener('touchmove', onTouchMove, { passive: true })
      window.addEventListener('keydown', onKey)
    }, 1200)
    const auto = setTimeout(go, AUTO_ENTER)
    return () => {
      clearTimeout(arm)
      clearTimeout(auto)
      root.removeEventListener('wheel', onWheel)
      root.removeEventListener('click', go)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
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
          const off = { left: { xPercent: -120 }, right: { xPercent: 120 }, top: { yPercent: -160 }, bottom: { yPercent: 160 } }[d.from]
          tl.from(el, { ...off, rotation: d.rot + (d.from === 'right' ? 18 : -18), duration: 0.75, ease: 'back.out(1.6)' }, at)
        }
        // 들어온 뒤 살짝 둥둥
        if (d.float && !reduce) {
          tl.to(el, { y: i % 2 ? -8 : 8, rotation: d.rot + (i % 2 ? 4 : -4), duration: 2.2 + (i % 3) * 0.4, ease: 'sine.inOut', repeat: -1, yoyo: true }, at + 0.7)
        }
      })
      popRef.current = tl
      // 타이틀이 먼저 톡 나타나고, 이어서 장식들이 튀어 들어옴
      gsap.from(titleRef.current, { scale: 0.85, opacity: 0, duration: 0.7, ease: 'back.out(1.8)', delay: 0.15 })
      gsap.from('.start__sub', { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out', delay: 0.4 })
      tl.delay(0.35).play()
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
        <div className="start__content">
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
            src={`${IMG}/Main_Title.png`}
            alt="한남대 고양이가 학생이 되었다."
            style={pos({ x: 234, y: 328, w: 979 })}
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

      <p className="start__hint">{IS_TOUCH ? '화면을 눌러 등교하기' : '스크롤하거나 화면을 눌러 등교하기'}</p>
    </main>
  )
}

