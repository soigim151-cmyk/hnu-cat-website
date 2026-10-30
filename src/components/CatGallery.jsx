import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { GALLERY } from '../data/gallery.js'
import './CatGallery.css'

const DIR = `${import.meta.env.BASE_URL}images/gallery/`
const thumbSrc = (it) => `${DIR}${it.id}_s.webp`
const largeSrc = (it) => (it.type === 'video' ? `${DIR}${it.id}.mp4` : `${DIR}${it.id}_l.webp`)

// 사진을 3줄로 나눔 (0,3,6… / 1,4,7… / 2,5,8…)
const ROWS = [0, 1, 2].map((r) => GALLERY.map((_, i) => i).filter((i) => i % 3 === r))
const ROW_SECONDS = [90, 110, 100] // 줄마다 한 바퀴 도는 시간 (조금씩 달라서 단조롭지 않게)

// 지도 아래 화면에 3줄로 깔리는 갤러리: 사진이 옆으로 계속 흘러감 (모든 사진 세로 길이 동일)
export default function CatGallery() {
  const [open, setOpen] = useState(-1) // 크게 보는 사진 번호 (-1 = 닫힘)

  return (
    <section className="gallery" id="cat-gallery" aria-labelledby="gallery-title">
      <h2 className="gallery__title" id="gallery-title">
        (HNU CATS)
      </h2>
      <div className="gallery__rows">
        {ROWS.map((row, r) => (
          // 같은 줄을 두 번 이어 붙여서 끊김 없이 반복, 가운데 줄은 반대 방향
          <div
            key={r}
            className={`gallery__track${r % 2 ? ' is-reverse' : ''}${open >= 0 ? ' is-paused' : ''}`}
            style={{ '--dur': `${ROW_SECONDS[r]}s` }}
          >
            {[...row, ...row].map((i, k) => {
              const it = GALLERY[i]
              const copy = k >= row.length
              return (
                <figure key={`${it.id}-${k}`} className="gallery__item">
                  <button
                    type="button"
                    className="gallery__thumb"
                    onClick={() => setOpen(i)}
                    aria-label={`${it.caption} 크게 보기`}
                    tabIndex={copy ? -1 : 0}
                    aria-hidden={copy}
                  >
                    <img src={thumbSrc(it)} alt="" loading="lazy" style={{ aspectRatio: `${it.w} / ${it.h}` }} />
                    {it.type === 'video' && <span className="gallery__play" aria-hidden="true" />}
                  </button>
                  <figcaption className="gallery__caption" aria-hidden={copy}>
                    {it.caption}
                  </figcaption>
                </figure>
              )
            })}
          </div>
        ))}
      </div>

      {/* 크게 보기는 맨 위층(body)에 띄움 */}
      {open >= 0 && createPortal(<Lightbox index={open} onChange={setOpen} onClose={() => setOpen(-1)} />, document.body)}
    </section>
  )
}

// 크게 보기: 어두운 배경 위에 사진/동영상, 좌우 이동, ESC·배경 클릭으로 닫기
function Lightbox({ index, onChange, onClose }) {
  const it = GALLERY[index]
  const boxRef = useRef(null)
  const mediaRef = useRef(null)
  const closeRef = useRef(null)

  const go = useCallback((d) => onChange((index + d + GALLERY.length) % GALLERY.length), [index, onChange])

  // 열릴 때 배경 fade, 사진 바뀔 때 살짝 커지며 등장
  useEffect(() => {
    gsap.fromTo(boxRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    closeRef.current?.focus()
  }, [])
  useEffect(() => {
    gsap.fromTo(mediaRef.current, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' })
  }, [index])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    // 열려 있는 동안 뒤 페이지 스크롤 막기
    const scroller = document.querySelector('.campus')
    const prev = scroller?.style.overflowY
    if (scroller) scroller.style.overflowY = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      if (scroller) scroller.style.overflowY = prev
    }
  }, [go, onClose])

  // 휴대폰: 좌우로 밀어서 넘기기
  const touchX = useRef(null)

  return (
    <div
      className="lightbox"
      ref={boxRef}
      role="dialog"
      aria-modal="true"
      aria-label={it.caption}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <figure className="lightbox__figure" ref={mediaRef} key={it.id}>
        {it.type === 'video' ? (
          <video className="lightbox__media" src={largeSrc(it)} poster={thumbSrc(it)} controls autoPlay loop playsInline />
        ) : (
          <img className="lightbox__media" src={largeSrc(it)} alt={it.caption} />
        )}
        <figcaption className="lightbox__caption">
          {it.caption}
          <span className="lightbox__count">
            {index + 1} / {GALLERY.length}
          </span>
        </figcaption>
      </figure>

      <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="이전 사진">
        ‹
      </button>
      <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="다음 사진">
        ›
      </button>
      <button type="button" className="lightbox__close" ref={closeRef} onClick={onClose} aria-label="닫기">
        ✕
      </button>
    </div>
  )
}
