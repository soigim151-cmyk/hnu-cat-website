import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './StartPage.css'
import { VIEW_MODE } from '../components/viewMode.js'

// Figma 프레임(1440 × 1014) 기준 좌표입니다. 단위는 Figma px.
// 화면 크기에 맞춰 CSS 변수 --u 로 한꺼번에 확대·축소됩니다.
// BASE_URL: 로컬에선 '/', GitHub Pages에선 '/hnu-cat-website/'
const IMG = `${import.meta.env.BASE_URL}images`

// 둥둥 떠다니는 장식 (w·h: 크기, dur: 왕복 시간(초), delay: 시작 지연, rot: 회전 방향)
const STARS = [
  { name: 'star-big', x: 159, y: 177, w: 254, h: 251, rot: 1, dur: 3.0, delay: 0 },
  { name: 'star-small', x: 1114, y: 195, w: 110, h: 109, rot: -1, dur: 2.6, delay: 0.5 },
  { name: 'star-filled', x: 298, y: 541, w: 90, h: 87, rot: 1, dur: 2.4, delay: 0.9 },
  { name: 'sparkle-left', x: 201, y: 447, w: 90, h: 120, rot: -1, dur: 3.2, delay: 0.3 },
  { name: 'sparkle-right', x: 1144, y: 322, w: 155, h: 147, rot: 1, dur: 2.8, delay: 0.7 },
]
const PAW = { x: 1154, y: 476, w: 134, h: 131, rot: -1, dur: 3.4, delay: 1.2 }

// 흔들림 크기 (Figma px 기준 → 화면 크기에 맞춰 함께 커지고 작아짐)
const FLOAT_Y = 12 // 위아래 ±12px
const FLOAT_ROT = 10 // 회전 ±10도

// 위치값을 CSS 변수로 넘기는 헬퍼
const pos = ({ x, y, w }) => ({ '--x': x, '--y': y, '--w': w })

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function StartPage({ onEnterCampus }) {
  const rootRef = useRef(null)
  const titleRef = useRef(null)
  const leavingRef = useRef(false) // 중복 클릭 방지

  // ── 등장 애니메이션 + 별 둥둥 ─────────────────────
  useLayoutEffect(() => {
    const reduce = prefersReducedMotion()
    const ctx = gsap.context(() => {
      // 타이틀: 아래 25px에서 떠오르며 나타남
      gsap.from(titleRef.current, {
        y: reduce ? 0 : 25,
        opacity: 0,
        duration: reduce ? 0.3 : 0.9,
        ease: 'expo.out',
        delay: 0.2,
      })
      // 서브타이틀은 타이틀을 따라 살짝 늦게 나타남 (투명도만)
      gsap.from('.start__sub', { opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.5 })

      if (reduce) return

      // 별·반짝이·발바닥: 각자 다른 주기·지연으로 위아래 흔들림 + 회전
      // 처음엔 원래 위치(0)에서 출발해 끊김 없이 반복으로 이어집니다.
      // yPercent(요소 높이 대비 %)를 써서 화면 크기가 바뀌어도 비율이 유지됩니다.
      const floaters = [...STARS, PAW]
      gsap.utils.toArray('.start__float').forEach((el, i) => {
        const f = floaters[i]
        const dir = i % 2 === 0 ? 1 : -1
        const amp = (FLOAT_Y / f.h) * 100 // f.h = Figma px 높이
        gsap
          .timeline({ delay: f.delay })
          .to(el, { yPercent: amp * dir, rotation: FLOAT_ROT * f.rot, duration: f.dur / 2, ease: 'sine.out' })
          .to(el, {
            yPercent: -amp * dir,
            rotation: -FLOAT_ROT * f.rot,
            duration: f.dur,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })
      })
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

  // ── 등교하기: 퇴장 애니메이션 후 페이지 전환 ────────
  const handleEnter = () => {
    if (leavingRef.current) return
    leavingRef.current = true

    const q = gsap.utils.selector(rootRef)
    const d = prefersReducedMotion() ? 0.2 : 0.5
    gsap
      .timeline({ defaults: { duration: d, ease: 'power2.inOut' }, onComplete: onEnterCampus })
      .to(titleRef.current, { opacity: 0, scale: 1.05, overwrite: 'auto' }, 0)
      .to(q('.start__sub, .start__actions, .start__deco, .start__bg, .start__stage--cover'), { opacity: 0 }, 0)
  }

  return (
    <main className="start" ref={rootRef}>
      {/* 흐린 발바닥: 화면 비율이 달라도 가장자리가 잘려 보이지 않도록 화면 전체를 덮는 별도 무대 */}
      <div className="start__stage start__stage--cover" aria-hidden="true">
        <img className="start__layer start__blur" src={`${IMG}/Decorations2.png`} alt="" style={pos({ x: 0, y: 87, w: 1440 })} />
      </div>

      <div className="start__stage">
        {/* 배경: 격자 */}
        <div className="start__bg" aria-hidden="true">
          <img className="start__layer" src={`${IMG}/Grid.png`} alt="" style={pos({ x: 60, y: 72, w: 1323 })} />
        </div>

        {/* 장식: 별 + 발바닥 (개별 요소) */}
        <div className="start__deco" aria-hidden="true">
          {STARS.map((s) => (
            <img
              key={s.name}
              className="start__layer start__star start__float"
              src={`${IMG}/deco/${s.name}.png`}
              alt=""
              style={pos(s)}
            />
          ))}
          {/* 발바닥: 바깥 상자는 둥둥, 안쪽 이미지는 마우스 hover 반응 */}
          <div className="start__layer start__float start__paw-wrap" style={pos(PAW)}>
            <img className="start__paw" src={`${IMG}/deco/paw.png`} alt="" />
          </div>
        </div>

        {/* 타이틀 */}
        <h1 className="start__title-wrap">
          <img
            ref={titleRef}
            className="start__layer start__title"
            src={`${IMG}/Main_Title.png`}
            alt="한남대 고양이가 학생이 되었다."
            style={pos({ x: 262.5, y: 245, w: 915 })}
          />
        </h1>
        <img
          className="start__layer start__sub"
          src={`${IMG}/sub_Title.png`}
          alt="The cat at Hannam University became a student."
          style={pos({ x: 539.5, y: 661, w: 361 })}
        />

        {/* 버튼 */}
        <nav className="start__actions">
          <PressButton className="start__btn start__btn--story">스토리</PressButton>
          <PressButton className="start__btn start__btn--school" onClick={handleEnter}>
            등교하기
          </PressButton>
        </nav>
      </div>
    </main>
  )
}

// 키보드(Enter/Space)로 눌러도 마우스 클릭과 같은 눌림 효과가 보이는 버튼
function PressButton({ className, children, onClick }) {
  const press = (on) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') e.currentTarget.classList.toggle('is-pressed', on)
  }
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      onKeyDown={press(true)}
      onKeyUp={press(false)}
      onBlur={(e) => e.currentTarget.classList.remove('is-pressed')}
    >
      {children}
    </button>
  )
}
