import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import './DialogScene.css'

const BASE = import.meta.env.BASE_URL
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000))

// 대화 화면
// 1) 배경만 → 0.7초 뒤 대화창(장소 안내) 등장
// 2) 클릭할 때마다: before 연출 → 대사 타이핑 → after 연출(자동)
// 3) 마지막 줄의 after 에서 캐릭터 퇴장 → 대화창 페이드 아웃 → 지도로
export default function DialogScene({ dialog, onClose }) {
  const rootRef = useRef(null)
  const curtainRef = useRef(null)
  const boxRef = useRef(null)
  const charRef = useRef(null)
  const nameRef = useRef(null)
  const typingRef = useRef(null)
  const busyRef = useRef(true)
  const aliveRef = useRef(true)
  const nameMapRef = useRef({}) // '???' → '김시유' 처럼 공개된 이름

  const [reward, setReward] = useState(null) // 획득 아이템
  const rewardDoneRef = useRef(null)
  const [step, setStep] = useState(-1) // -1 = 장소 안내
  const [typed, setTyped] = useState(0)
  const [box, setBox] = useState(false) // 대화창 보임
  const [ready, setReady] = useState(false) // 다음으로 넘길 수 있음 (화살표)
  const [pose, setPose] = useState(null) // 지금 자세 (null = 캐릭터 없음)
  const [poseDur, setPoseDur] = useState(0.3)
  const [name, setName] = useState('')
  const [srcs, setSrcs] = useState({}) // 자세 → 실제로 불러온 이미지 주소 (없으면 기본 이미지)

  const lines = dialog.lines
  const line = step < 0 ? { text: dialog.place, place: true } : lines[step]
  const full = line.text

  // 공개된 이름 반영 ('???' 가 '김시유' 로 바뀐 뒤엔 계속 '김시유')
  const shown = (who) => (who && nameMapRef.current[who]) || who

  // ── 타이핑 (35ms/글자) ──
  const finishRef = useRef(null) // 타이핑 중이면: 바로 끝내는 함수
  const typeLine = useCallback(
    (text) =>
      new Promise((resolve) => {
        let n = 0
        setTyped(0)
        clearInterval(typingRef.current)
        const end = () => {
          clearInterval(typingRef.current)
          typingRef.current = null
          finishRef.current = null
          setTyped(text.length)
          resolve()
        }
        finishRef.current = end
        typingRef.current = setInterval(() => {
          n += 1
          setTyped(n)
          if (n >= text.length) end()
        }, dialog.typeSpeed ?? 35)
      }),
    [dialog.typeSpeed],
  )

  // ── 연출 명령 실행 ──
  const run = useCallback(
    async (actions = []) => {
      for (const a of actions) {
        if (!aliveRef.current) return
        if (a.wait) await sleep(a.wait)
        else if (a.show) {
          setPoseDur(a.dur ?? 0.4)
          setPose(a.show)
          if (a.from === 'bottom') {
            // 아래에서 위로 쑥 올라오며 등장
            await gsap.fromTo(
              charRef.current,
              { yPercent: 70, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: a.dur ?? 0.6, ease: 'back.out(1.4)' },
            )
          } else await sleep(a.dur ?? 0.4)
        } else if (a.pose) {
          setPoseDur(a.dur ?? 0.3)
          setPose(a.pose)
          await sleep(a.dur ?? 0.3)
        } else if (a.reward) {
          // 아이템 획득: 대화창을 치우고 튀어나오고, 한 번 누르면 다음으로
          await gsap.to(boxRef.current, { opacity: 0, y: 16, duration: 0.25, ease: 'power2.in' })
          setReward({ src: a.reward, label: a.label })
          await new Promise((res) => (rewardDoneRef.current = res))
          await gsap.to('.dialog__reward', { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' })
        } else if (a.enter) {
          const el = rootRef.current.querySelector(`[data-extra="${a.enter}"]`)
          if (el) await gsap.fromTo(el, { xPercent: 18, opacity: 0 }, { xPercent: 0, opacity: Number(el.dataset.opacity || 1), duration: a.dur ?? 0.5, ease: 'power2.out' })
        } else if (a.leave) {
          const el = rootRef.current.querySelector(`[data-extra="${a.leave}"]`)
          if (el) await gsap.to(el, { xPercent: 22, opacity: 0, duration: a.dur ?? 0.6, ease: 'power2.in' })
        } else if (a.look) {
          // 두리번: 배경이 좌우로 살짝
          await gsap
            .timeline()
            // 천천히 왼쪽을 보고 → 잠깐 멈췄다가 → 오른쪽을 보고 → 제자리 (도리도리가 아니라 둘러보는 느낌)
            .to('.dialog__bg', { x: -30, duration: 1.0, ease: 'sine.inOut' })
            .to('.dialog__bg', { x: 26, duration: 1.4, ease: 'sine.inOut' }, '+=0.35')
            .to('.dialog__bg', { x: 0, duration: 0.9, ease: 'sine.inOut' }, '+=0.3')
        } else if (a.rise) {
          // 벌떡 일어나기: 누운 그림은 제자리에서 아래로 쑥 사라지고,
          // 선 그림이 원래 자리에서 튀어 오르듯 나타남 (누운 그림이 옆으로 미끄러지지 않게)
          const el = charRef.current
          await gsap.to(el, { y: 40, opacity: 0, duration: 0.18, ease: 'power2.in' })
          setPoseDur(0)
          setPose(a.rise)
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))) // 자리 바뀐 뒤
          await gsap.fromTo(
            el,
            { y: 60, opacity: 0, scaleY: 0.94, transformOrigin: '50% 100%' },
            { y: 0, opacity: 1, scaleY: 1, duration: a.dur ?? 0.35, ease: 'back.out(2.2)' },
          )
        } else if (a.rename) {
          const el = nameRef.current
          await gsap.to(el, { opacity: 0, duration: (a.dur ?? 0.2) / 2 })
          nameMapRef.current['???'] = a.rename
          setName(a.rename)
          await gsap.to(el, { opacity: 1, duration: (a.dur ?? 0.2) / 2 })
        } else if (a.exit) {
          const el = charRef.current
          if (el) await gsap.to(el, { x: `+=${a.exit}`, opacity: 0, duration: a.dur ?? 0.7, ease: 'power1.in' })
        } else if (a.close) {
          await gsap.to(boxRef.current, { opacity: 0, duration: a.close })
          await gsap.to(rootRef.current, { opacity: 0, duration: 0.3 })
          onClose()
          return
        }
      }
    },
    [onClose],
  )

  // ── 한 줄 진행 ──
  const play = useCallback(
    async (i) => {
      busyRef.current = true
      setReady(false)
      const l = lines[i]
      if (i === 0 && curtainRef.current) await gsap.to(curtainRef.current, { opacity: 0, duration: 0.8, ease: 'power1.inOut' })
      const gap = l.page ? 0.15 : (dialog.gap ?? 0.3)
      await sleep(gap)
      await run(l.before)
      if (!aliveRef.current) return
      setStep(i)
      setName(shown(l.who) || '')
      await typeLine(l.text)
      await run(l.after)
      if (!aliveRef.current) return
      busyRef.current = false
      setReady(true)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, dialog.gap, run, typeLine],
  )

  // ── 시작: 배경만 → 0.7초 뒤 장소 안내 ──
  useLayoutEffect(() => {
    aliveRef.current = true
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })
    gsap.fromTo('.dialog__bg', { scale: 1.06 }, { scale: 1, duration: 1.4, ease: 'expo.out' })
    let cancelled = false
    ;(async () => {
      await sleep(0.7)
      if (cancelled) return
      setBox(true)
      await typeLine(dialog.place)
      busyRef.current = false
      setReady(true)
    })()
    return () => {
      cancelled = true
      aliveRef.current = false
      clearInterval(typingRef.current)
    }
  }, [dialog.place, typeLine])

  // 대화창 등장
  useEffect(() => {
    if (box) gsap.fromTo(boxRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
  }, [box])

  const close = useCallback(() => {
    aliveRef.current = false
    clearInterval(typingRef.current)
    gsap.to(rootRef.current, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: onClose })
  }, [onClose])

  const next = useCallback(() => {
    if (rewardDoneRef.current) {
      const done = rewardDoneRef.current
      rewardDoneRef.current = null
      return done()
    }
    if (finishRef.current) return finishRef.current() // 타이핑 중이면 한 번에 다 보여주기
    if (busyRef.current) return // 자동 연출 중
    if (step + 1 < lines.length) play(step + 1)
  }, [step, lines.length, play])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      else if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, close])

  const ch = dialog.character

  // 자세 이미지를 미리 확인해서, 없는 건 기본 이미지로 (불러오다 실패하며 비는 순간이 없도록)
  useEffect(() => {
    let off = false
    Object.keys(seenPoses(lines)).forEach((p) => {
      const url = `${BASE}${ch.folder}${p}.png`
      const img = new Image()
      img.onload = () => !off && setSrcs((m) => ({ ...m, [p]: url }))
      img.onerror = () => !off && setSrcs((m) => ({ ...m, [p]: BASE + ch.fallback }))
      img.src = url
    })
    return () => {
      off = true
    }
  }, [lines, ch.folder, ch.fallback])

  // 지금 보여줄 이미지 (확인 전이면 기본 이미지)
  const curSrc = pose ? srcs[pose] || BASE + ch.fallback : null

  return createPortal(
    <div className="dialog" ref={rootRef} role="dialog" aria-modal="true" aria-label={dialog.place} onClick={next}>
      <div className="dialog__stage">
        <img className="dialog__bg" src={BASE + dialog.bg} alt="" />

        {/* 보조 인물 실루엣 (처음엔 숨김, enter 로 등장) */}
        {Object.entries(dialog.extras || {}).map(([key, ex]) => (
          <img
            key={key}
            data-extra={key}
            data-opacity={ex.opacity ?? 1}
            className={`dialog__extra dialog__extra--${key}`}
            src={BASE + ex.src}
            alt=""
            style={{ opacity: 0 }}
          />
        ))}

        {/* 캐릭터: 이전 그림은 그대로 두고 새 그림만 위에 페이드 인 (중간에 비치거나 깜빡이지 않게) */}
        <div className={`dialog__char${pose?.startsWith('lying') ? ' is-lying' : ''}`} ref={charRef}>
          {curSrc && <PoseLayer src={curSrc} dur={poseDur} />}
        </div>

        {/* 장소 안내 동안 검은 화면 → 첫 대사에서 걷힘 */}
        <div className="dialog__curtain" ref={curtainRef} />

        {box && (
          <div ref={boxRef} className={`dialog__box${line.who ? ' has-name' : ''}${line.place ? ' is-place' : ''}${line.who && !dialog.main?.includes(line.who) ? ' is-flip' : ''}`}>
            {line.who && (
              <span className="dialog__name" ref={nameRef}>
                {name}
              </span>
            )}
            <p className="dialog__text" aria-live="polite">
              {full.slice(0, typed)}
              <span className="dialog__ghost" aria-hidden="true">
                {full.slice(typed)}
              </span>
            </p>
            {ready && <img className="dialog__next" src={`${BASE}talk/arrow.png`} alt="" />}
          </div>
        )}
      </div>

      {reward && <RewardPop src={BASE + reward.src} label={reward.label} />}

      <button
        type="button"
        className="dialog__close"
        onClick={(e) => {
          e.stopPropagation()
          close()
        }}
        aria-label="대화 닫기"
      >
        ✕
      </button>
    </div>,
    document.body,
  )
}

// 대본에 나오는 자세 목록 (미리 다 불러둬서 교체가 끊기지 않게)
function seenPoses(lines) {
  const set = {}
  for (const l of lines)
    for (const a of [...(l.before || []), ...(l.after || [])]) {
      if (a.pose) set[a.pose] = true
      if (a.show) set[a.show] = true
      if (a.rise) set[a.rise] = true
    }
  return set
}

// 그림이 바뀔 때: 아래에는 이전 그림을 불투명하게 두고, 새 그림만 위에서 서서히 나타남.
// 같은 그림이면 아무 전환도 하지 않음.
function PoseLayer({ src, dur }) {
  const [base, setBase] = useState(src)
  const topRef = useRef(null)
  const top = src !== base ? src : null // 새로 나타날 그림

  useLayoutEffect(() => {
    if (!top || !topRef.current) return
    const t = gsap.fromTo(
      topRef.current,
      { opacity: 0 },
      { opacity: 1, duration: dur, ease: 'power1.out', onComplete: () => setBase(top) },
    )
    return () => t.kill()
  }, [top, dur])

  return (
    <>
      <img className="dialog__pose" src={base} alt="" />
      {top && <img key={top} ref={topRef} className="dialog__pose" src={top} alt="" style={{ opacity: 0 }} />}
    </>
  )
}

// '휙득!' 아이템 등장: 빙글 돌며 크게 튀어나오고, 빛이 뒤에서 돌며, 글자가 톡 튐
function RewardPop({ src, label }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const q = gsap.utils.selector(ref)
    const tl = gsap.timeline()
    tl.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .fromTo(q('.dialog__reward-shine'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' }, 0)
      .fromTo(
        q('.dialog__reward-card'),
        { scale: 0.1, rotation: -540, y: 120, opacity: 0 },
        { scale: 1, rotation: -4, y: 0, opacity: 1, duration: 0.75, ease: 'back.out(1.6)' },
        0.05,
      )
      .fromTo(q('.dialog__reward-label'), { scale: 0, y: 20 }, { scale: 1, y: 0, duration: 0.45, ease: 'back.out(3)' }, 0.55)
      .fromTo(q('.dialog__reward-hint'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.1)
    gsap.to(q('.dialog__reward-shine'), { rotation: 360, duration: 8, ease: 'none', repeat: -1 })
    gsap.to(q('.dialog__reward-card'), { y: -8, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.8 })
    return () => tl.kill()
  }, [])
  return (
    <div className="dialog__reward" ref={ref}>
      <div className="dialog__reward-shine" />
      <p className="dialog__reward-label">{label}</p>
      <img className="dialog__reward-card" src={src} alt={label} />
      <p className="dialog__reward-hint">눌러서 계속</p>
    </div>
  )
}
