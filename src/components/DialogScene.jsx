import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import './DialogScene.css'

const BASE = import.meta.env.BASE_URL
const TYPE_SPEED = 32 // ms: 한 글자씩 나오는 간격

// 대화 화면: 장소 안내 → 대사 한 줄씩 (누르거나 Space/Enter/→ 로 다음)
export default function DialogScene({ dialog, onClose }) {
  const rootRef = useRef(null)
  const charRefs = useRef({})
  // step -1 = 장소 안내, 0~ = lines
  const [step, setStep] = useState(-1)
  const [typed, setTyped] = useState(0)

  const line = step < 0 ? { text: dialog.place, place: true } : dialog.lines[step]
  const full = line.text
  const done = typed >= full.length
  const isLast = step === dialog.lines.length - 1

  // 지금까지 등장한 캐릭터 (show 가 나온 뒤부터 화면에 있음)
  const onStage = {}
  for (let i = 0; i <= step; i++) if (dialog.lines[i].show) onStage[dialog.lines[i].show] = true

  // 열릴 때: 배경 부드럽게 등장
  useLayoutEffect(() => {
    const t = gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })
    gsap.fromTo('.dialog__bg', { scale: 1.06 }, { scale: 1, duration: 1.4, ease: 'expo.out' })
    return () => t.kill()
  }, [])

  // 한 글자씩 타이핑
  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setTyped((n) => n + 1), TYPE_SPEED)
    return () => clearTimeout(t)
  }, [typed, done])

  // 캐릭터 퇴장
  const hideKey = step >= 0 ? dialog.lines[step].hide : null
  useEffect(() => {
    const el = hideKey && charRefs.current[hideKey]
    if (el) gsap.to(el, { xPercent: 30, opacity: 0, duration: 0.8, ease: 'power2.in' })
  }, [hideKey])

  const close = useCallback(() => {
    gsap.to(rootRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: onClose })
  }, [onClose])

  const next = useCallback(() => {
    if (!done) return setTyped(full.length) // 타이핑 중이면 한 번에 다 보여주기
    if (isLast) return close()
    setStep((s) => s + 1)
    setTyped(0)
  }, [done, full, isLast, close])

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

  return createPortal(
    <div className="dialog" ref={rootRef} role="dialog" aria-modal="true" aria-label={dialog.place} onClick={next}>
      <div className="dialog__stage">
        <img className="dialog__bg" src={BASE + dialog.bg} alt="" />

        {Object.entries(dialog.characters).map(([key, src]) =>
          onStage[key] ? (
            <img
              key={key}
              ref={(el) => {
                if (el && !charRefs.current[key]) {
                  charRefs.current[key] = el
                  gsap.fromTo(el, { yPercent: 18, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.6)' })
                }
              }}
              className="dialog__char"
              src={BASE + src}
              alt=""
            />
          ) : null,
        )}

        <div className={`dialog__box${line.who ? ' has-name' : ''}${line.place ? ' is-place' : ''}`}>
          {line.who && <span className="dialog__name">{line.who}</span>}
          <p className="dialog__text" aria-live="polite">
            {full.slice(0, typed)}
            <span className="dialog__ghost" aria-hidden="true">
              {full.slice(typed)}
            </span>
          </p>
          {done && <img className="dialog__next" src={`${BASE}talk/arrow.png`} alt="" />}
        </div>
      </div>

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
