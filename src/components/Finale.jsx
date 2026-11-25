// 마지막 퀘스트 (신전이가 전해 달라던 말 적기) → 신전이의 인사 → 반전 → 만든 이유 → 끝
// 글이 한꺼번에 몰려나오지 않게: 장면마다 사진이 바뀌고, 한 줄씩 천천히. 화면을 누르면 다음으로 (가만히 있어도 넘어감)
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { playSfx, playBgm, stopBgm } from './sfx.js'
import './Finale.css'

const BASE = import.meta.env.BASE_URL
const JEON_LINE = '그동안 고마웠다고. 다들 덕분에, 여기서 지내는 게 참 좋았다고.'

// ── 마지막 퀘스트 창 (지도 위) ──
export function FinalQuest({ onDone }) {
  const [text, setText] = useState('')
  const [hint, setHint] = useState(false)
  const [wrong, setWrong] = useState(false)
  const cardRef = useRef(null)
  const submit = (e) => {
    e.preventDefault()
    const t = text.replace(/\s/g, '')
    if (/고마|감사|고맙/.test(t)) {
      playSfx('complete')
      onDone(text.trim())
    } else {
      playSfx('deny')
      setWrong(true)
      gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' })
    }
  }
  return createPortal(
    <div className="fq" role="dialog" aria-modal="true" aria-label="마지막 퀘스트">
      <form className="fq__card" ref={cardRef} onSubmit={submit}>
        <p className="fq__kicker">LAST QUEST</p>
        <h2 className="fq__title">신전이 선배의 부탁</h2>
        <p className="fq__desc">신전이 선배가 대신 전해 달라고 했던 말을 적어 주세요.</p>
        <textarea
          className="fq__input"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setWrong(false)
          }}
          rows={3}
          maxLength={120}
          placeholder="여기에 적어 주세요"
          aria-label="전할 말"
          autoFocus
        />
        {wrong && <p className="fq__wrong">음…. 선배가 뭐라고 했더라? 힌트를 눌러 봐요.</p>}
        {hint && <p className="fq__hint">“지금까지 나와 함께해 줘서 ○○○”</p>}
        <div className="fq__actions">
          <button type="button" className="fq__btn" onClick={() => setHint(true)}>
            힌트
          </button>
          <button type="submit" className="fq__btn is-main" disabled={!text.trim()}>
            전하기
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

// ── 엔딩 장면들 ──
// kind: note(내가 전한 말) · talk(신전이 대화) · credits(만든 이유, 엔딩 크레딧처럼 올라감) · end(마지막 카드)
const CREDITS = [
  { t: '한남대 고양이가 학생이 되었다', cls: 'is-title' },
  { gap: true },
  { t: '학교 곳곳에는 우리가 미처 알지 못한 작은 존재들이 함께 살고 있습니다.' },
  { t: '벤치 위에서, 화단 사이에서, 건물 앞 계단에서.' },
  { gap: true },
  { t: '신전이처럼 스쳐 가는 인연일지도 모릅니다.' },
  { t: '하지만 누군가에게는, 오래 남는 추억이 되기도 하죠.' },
  { gap: true },
  { t: '사람도, 고양이도 서로 불편하지 않은 학교를 바라며' },
  { t: '이 이야기를 만들었습니다.' },
  { gap: true },
  { t: '우리 학교가 그냥 지나치는 곳이 아니라,' },
  { t: '추억과 청춘이 머무는 곳이 되기를.' },
  { gap: true },
  { gap: true },
  { t: '등장인물', cls: 'is-head' },
  { t: '김시유 · 이고등 · 턱시혁' },
  { t: '한남이 · 한나미' },
  { t: '치주일 · 치주이 · 치주삼 · 치주사' },
  { t: '신전이' },
  { gap: true },
  { t: '그리고, 한남대학교의 모든 고양이들', cls: 'is-head' },
]
const scenes = (msg) => [
  { kind: 'note', bg: 'talk/m56/bg.webp', label: '내가 전한 말', text: msg },
  { kind: 'talk', bg: 'talk/m56/bg.webp', jeon: true, who: '신전이', text: '…전해 줘서 고마워, 후배.' },
  { kind: 'talk', bg: 'talk/m56/bg.webp', jeon: true, fade: true, who: '신전이', text: '덕분에 이 학교에서 보낸 시간이 참 따뜻했어. 이제 정말 졸업할게.' },
  { kind: 'credits' },
  { kind: 'end' },
]

export function Finale({ message, onGallery, onClose }) {
  const list = useRef(scenes(message)).current
  const [i, setI] = useState(0)
  const rootRef = useRef(null)
  const lockRef = useRef(true)
  const s = list[i]

  // 장면이 바뀔 때: 사진과 글을 차례로 띄움
  useLayoutEffect(() => {
    lockRef.current = true
    const q = gsap.utils.selector(rootRef)
    const tl = gsap.timeline({ onComplete: () => (lockRef.current = false) })
    tl.fromTo(q('.fin__bg, .fin__photo'), { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' })
      .fromTo(q('.fin__line'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.7 }, 0.4)
    if (s.fade) tl.to(q('.fin__jeon'), { opacity: 0, duration: 3, ease: 'power1.in' }, 1.2)
    if (s.kind === 'credits') {
      const roll = q('.fin__roll')[0]
      tl.fromTo(roll, { y: window.innerHeight }, { y: () => -roll.offsetHeight, duration: 62, ease: 'none', onComplete: () => goNext.current?.() }, 0)
    }
    return () => tl.kill()
  }, [i, s.fade])

  // 장면별 음악
  useEffect(() => {
    if (s.kind === 'note' || s.kind === 'talk') playBgm('sad', undefined, 2)
    if (s.kind === 'credits') playBgm('piano', undefined, 2.5)
  }, [s.kind])
  useEffect(() => () => stopBgm(1.5), [])

  const goNext = useRef(null)
  const next = useCallback(() => {
    if (s.kind === 'credits') {
      // 크레딧 중에 누르면 빨리 감기
      const tl = gsap.getTweensOf(rootRef.current.querySelector('.fin__roll'))[0]
      if (tl && tl.timeScale() < 1.5) return tl.timeScale(2)
    } else if (lockRef.current || i >= list.length - 1) return
    playSfx('tick')
    gsap.to(rootRef.current.querySelectorAll('.fin__scene'), {
      opacity: 0,
      duration: 0.6,
      onComplete: () => setI((n) => n + 1),
    })
  }, [i, list.length, s.kind])
  useEffect(() => {
    // 크레딧이 끝나면 마지막 카드로
    goNext.current = () => {
      gsap.to(rootRef.current.querySelectorAll('.fin__scene'), { opacity: 0, duration: 0.8, onComplete: () => setI((n) => n + 1) })
    }
  }, [next])

  // 가만히 있어도 천천히 넘어감
  useEffect(() => {
    if (s.kind === 'end' || s.kind === 'credits') return
    const t = setTimeout(next, s.kind === 'story' ? 6500 : 7500)
    return () => clearTimeout(t)
  }, [i, s.kind, next])

  return createPortal(
    <div className="fin" ref={rootRef} onClick={next} role="dialog" aria-modal="true" aria-label="엔딩">
      <div className="fin__scene" key={i}>
        {(s.kind === 'note' || s.kind === 'talk') && (
          <>
            <img className="fin__bg" src={BASE + s.bg} alt="" />
            <div className="fin__glow" />
            {s.jeon && <img className="fin__jeon" src={`${BASE}talk/m56/jeon.webp`} alt="신전이" />}
            {s.kind === 'note' ? (
              <div className="fin__note fin__line">
                <span className="fin__note-label">{s.label}</span>
                <p>“{s.text}”</p>
              </div>
            ) : (
              <div className="fin__box fin__line">
                <span className="fin__name">{s.who}</span>
                <p>{s.text}</p>
              </div>
            )}
          </>
        )}

        {s.kind === 'credits' && (
          <div className="fin__credits">
            <div className="fin__roll">
              {CREDITS.map((c, k) => (c.gap ? <div key={k} className="fin__gap" /> : <p key={k} className={c.cls}>{c.t}</p>))}
            </div>
          </div>
        )}

        {s.kind === 'end' && (
          <div className="fin__end">
            <img className="fin__photo fin__title" src={`${BASE}images/Main_Title_v2.png`} alt="한남대 고양이가 학생이 되었다!" />
            <p className="fin__line fin__small">다음에 캠퍼스를 걷다 고양이를 만나면, 반갑게 인사해 주세요.</p>
            <p className="fin__line fin__thanks">THANK YOU FOR PLAYING</p>
            <div className="fin__line fin__actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="fin__btn is-main"
                onClick={() => {
                  playSfx('select')
                  onGallery()
                }}
              >
                고양이 사진 보러 가기
              </button>
              <button
                type="button"
                className="fin__btn"
                onClick={() => {
                  playSfx('select')
                  onClose()
                }}
              >
                지도로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>

      {s.kind !== 'end' && (
        <div className="fin__dots" aria-hidden="true">
          {list.slice(0, -1).map((_, k) => (
            <span key={k} className={k === i ? 'is-on' : undefined} />
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
