// 지도 화면의 스토리 UI: 다음 장소 안내, 보관함, 아이템 크게 보기, 확인 창, 알림
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ITEMS } from '../data/story.js'
import './StoryUI.css'

const BASE = import.meta.env.BASE_URL
const SLOTS = 6 // 보관함 칸 수 (아이템이 더 많으면 늘어남)

// ── 위쪽 가운데: 지금 가야 할 장소 + 진행 단계 ──
export function QuestBar({ step, total, place, shown }) {
  return (
    <div className={`quest${shown ? ' is-shown' : ''}`} role="status">
      <span className="quest__dots" aria-label={`${total}곳 중 ${Math.min(step + 1, total)}번째`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`quest__dot${i < step ? ' is-done' : i === step ? ' is-now' : ''}`} />
        ))}
      </span>
      {place ? (
        <span className="quest__text">
          <b>NEXT</b> {place}
          <span className="quest__sub"> · 지도에서 눌러 보세요</span>
        </span>
      ) : (
        <span className="quest__text">
          <b>CLEAR</b> 모든 이야기를 완료했어요!
        </span>
      )}
    </div>
  )
}

// ── 오른쪽 위: 보관함 버튼 + 펼침 창 ──
export function Inventory({ items, isNew, onOpen, onPick, shown }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const ids = Object.keys(items)

  // 바깥을 누르면 닫힘
  useEffect(() => {
    if (!open) return
    const off = (e) => !ref.current?.contains(e.target) && setOpen(false)
    window.addEventListener('pointerdown', off)
    return () => window.removeEventListener('pointerdown', off)
  }, [open])

  const toggle = () => {
    setOpen((o) => !o)
    onOpen?.()
  }

  return (
    <div className={`bag${shown ? ' is-shown' : ''}`} ref={ref}>
      <button
        type="button"
        className={`bag__btn${isNew ? ' is-new' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label={`보관함 (${ids.length}개)`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 8h14l-1 12H6z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
        </svg>
        보관함
        {ids.length > 0 && <span className="bag__count">{ids.length}</span>}
      </button>

      {open && (
        <div className="bag__panel">
          <p className="bag__title">보관함</p>
          <ul className="bag__grid">
            {Array.from({ length: Math.max(SLOTS, ids.length) }, (_, i) => {
              const id = ids[i]
              const it = id && ITEMS[id]
              return (
                <li key={i} className={`bag__slot${it ? '' : ' is-empty'}`}>
                  {it && (
                    <button
                      type="button"
                      className={`bag__item${items[id] === 'used' ? ' is-used' : ''}`}
                      onClick={() => {
                        setOpen(false)
                        onPick(id)
                      }}
                    >
                      <img src={BASE + it.img} alt="" />
                      <span>{it.name}</span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          {ids.length === 0 && <p className="bag__empty">아직 모은 아이템이 없어요</p>}
        </div>
      )}
    </div>
  )
}

// ── 가운데 창 (배경 어둡게) ──
function Modal({ children, onClose, label }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="smodal" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className="smodal__card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// 아이템 크게 보기
export function ItemViewer({ id, state, onClose }) {
  const it = ITEMS[id]
  if (!it) return null
  return (
    <Modal onClose={onClose} label={it.name}>
      <div className="smodal__item">
        <img src={BASE + it.img} alt={it.name} />
        {state === 'used' && <span className="smodal__stamp">전달 완료</span>}
      </div>
      <p className="smodal__title">{it.name}</p>
      <p className="smodal__desc">{state === 'used' && it.usedDesc ? it.usedDesc : it.desc}</p>
      <div className="smodal__actions">
        <button type="button" className="smodal__btn is-main" onClick={onClose}>
          닫기
        </button>
      </div>
    </Modal>
  )
}

// 예/아니오 확인 창
export function Confirm({ title, desc, yes, no, onYes, onNo }) {
  return (
    <Modal onClose={onNo} label={title}>
      <p className="smodal__title">{title}</p>
      <p className="smodal__desc">{desc}</p>
      <div className="smodal__actions">
        <button type="button" className="smodal__btn" onClick={onNo}>
          {no}
        </button>
        <button type="button" className="smodal__btn is-main" onClick={onYes}>
          {yes}
        </button>
      </div>
    </Modal>
  )
}

// 아직 대화가 없는 장소
export function PlaceNote({ name, note, onDone }) {
  return (
    <Modal onClose={onDone} label={name}>
      <p className="smodal__kicker">STORY</p>
      <p className="smodal__title">{name}</p>
      <p className="smodal__desc">{note || '이 장소의 이야기는 곧 열려요.'}</p>
      <div className="smodal__actions">
        <button type="button" className="smodal__btn is-main" onClick={onDone}>
          확인
        </button>
      </div>
    </Modal>
  )
}

// 잠깐 떴다 사라지는 알림
export function Toast({ toast }) {
  return (
    <div className={`stoast${toast ? ' is-shown' : ''}`} role="status" aria-live="polite">
      {toast?.img && <img src={BASE + toast.img} alt="" />}
      <span>{toast?.text}</span>
    </div>
  )
}
