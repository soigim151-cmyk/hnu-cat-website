import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GALLERY } from '../data/gallery.js'
import './CatGallery.css'

const DIR = `${import.meta.env.BASE_URL}images/gallery/`
const thumbSrc = (it) => `${DIR}${it.id}_s.webp`
const largeSrc = (it) => (it.type === 'video' ? `${DIR}${it.id}.mp4` : `${DIR}${it.id}_l.webp`)

// 참고 이미지처럼 "흩뿌린" 배치: 12칸 격자에서 칸 위치·폭·위아래 어긋남을 정해 둔 패턴
// [시작 칸(1~12), 폭(칸 수), 위아래 어긋남(px)]
const PATTERN = [
  [1, 2, 0], [4, 2, 60], [7, 3, -20], [11, 2, 30],
  [2, 3, 10], [6, 2, 70], [9, 2, -10], [11, 2, 50],
  [1, 2, 40], [3, 3, -10], [8, 2, 30], [10, 3, 0],
  [2, 2, -20], [5, 3, 40], [9, 2, 10], [11, 2, -30],
]

export default function CatGallery() {
  const [open, setOpen] = useState(-1) // 크게 보는 사진 번호 (-1 = 닫힘)
  const sectionRef = useRef(null)

  // 스크롤해서 보이면 사진이 하나씩 떠오르며 나타남
  useEffect(() => {
    const items = sectionRef.current.querySelectorAll('.gallery__item')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.set(items, { opacity: 0, y: 30 })
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          gsap.to(e.target, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' })
          io.unobserve(e.target)
        })
      },
      { threshold: 0.15 },
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="gallery" id="cat-gallery" ref={sectionRef} aria-labelledby="gallery-title">
      <h2 className="gallery__title" id="gallery-title">
        (HNU CATS)
      </h2>
      <ul className="gallery__grid">
        {GALLERY.map((it, i) => {
          const [col, span, shift] = PATTERN[i % PATTERN.length]
          return (
            <li
              key={it.id}
              className="gallery__item"
              style={{ '--col': col, '--span': span, '--shift': `${shift}px` }}
            >
              <button type="button" className="gallery__thumb" onClick={() => setOpen(i)} aria-label={`${it.caption} 크게 보기`}>
                <img src={thumbSrc(it)} alt="" loading="lazy" style={{ aspectRatio: `${it.w} / ${it.h}` }} />
                {it.type === 'video' && <span className="gallery__play" aria-hidden="true" />}
              </button>
              <span className="gallery__caption">{it.caption}</span>
            </li>
          )
        })}
      </ul>

      {open >= 0 && <Lightbox index={open} onChange={setOpen} onClose={() => setOpen(-1)} />}
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
