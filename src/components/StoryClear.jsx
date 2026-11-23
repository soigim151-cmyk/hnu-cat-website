// 모든 장소가 같이 쓰는 마무리 화면 (STORY CLEAR) + 호감도 알림
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { playSfx } from './sfx.js'
import { CHARACTERS, ITEMS, LIKES_ON } from '../data/story.js'
import './StoryClear.css'

const BASE = import.meta.env.BASE_URL

// 장소 이야기를 끝냈을 때: 제목 · 한 줄 요약 · 얻은 것(아이템 · 호감도) · 지도로 버튼
export function StoryClear({ place, sub, items = [], likes = {}, onDone }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const q = gsap.utils.selector(ref)
    playSfx('complete')
    gsap
      .timeline()
      .fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
      .fromTo(q('.sclear__title'), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(2.2)' })
      .fromTo(q('.sclear__place, .sclear__sub'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.1 })
      .fromTo(q('.sclear__gain'), { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.08 })
      .fromTo(q('.sclear__btn'), { opacity: 0 }, { opacity: 1, duration: 0.3 })
  }, [])
  const likeList = LIKES_ON ? Object.entries(likes).filter(([, n]) => n > 0) : []
  return (
    <div className="sclear" ref={ref} onClick={(e) => e.stopPropagation()}>
      <p className="sclear__title">STORY CLEAR!</p>
      <p className="sclear__place">{place}</p>
      {sub && <p className="sclear__sub">{sub}</p>}
      {(items.length > 0 || likeList.length > 0) && (
        <ul className="sclear__gains">
          {items.map((id) => (
            <li key={id} className="sclear__gain">
              <img src={BASE + ITEMS[id].img} alt="" />
              {ITEMS[id].name} 획득
            </li>
          ))}
          {likeList.map(([who, n]) => (
            <li key={who} className="sclear__gain is-like">
              <span aria-hidden="true">♥</span> {CHARACTERS[who]} 호감도 +{n}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="sclear__btn"
        onClick={() => {
          playSfx('select')
          onDone()
        }}
      >
        지도로 돌아가기
      </button>
    </div>
  )
}

// 대화 중 호감도가 오를 때 잠깐 뜨는 알림
export function LikePop({ who, n }) {
  return (
    <div className="slike" key={`${who}-${n}`} role="status">
      <span className="slike__heart" aria-hidden="true">
        ♥
      </span>
      {CHARACTERS[who]} 호감도 +{n}
    </div>
  )
}
