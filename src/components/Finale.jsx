// 마지막 퀘스트 (신전이가 전해 달라던 말 적기) → 신전이의 인사 → 반전 → 만든 이유 → 끝
// 글이 한꺼번에 몰려나오지 않게: 장면마다 사진이 바뀌고, 한 줄씩 천천히. 화면을 누르면 다음으로 (가만히 있어도 넘어감)
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { playSfx, playBgm, stopBgm } from './sfx.js'
import './Finale.css'

const BASE = import.meta.env.BASE_URL
const G = (n) => `images/gallery/cat_${n}_l.webp` // 임시 사진 (갤러리 고양이)
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
        {hint && <p className="fq__hint">“그동안 ○○○다고. 다들 덕분에, 여기서 지내는 게 참 좋았다고.”</p>}
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
// kind: talk(신전이 대화) · reveal(반전) · story(만든 이유) · end(마지막 카드)
const scenes = (msg) => [
  { kind: 'note', bg: 'talk/m56/bg.webp', label: '내가 전한 말', text: msg },
  { kind: 'talk', bg: 'talk/m56/bg.webp', jeon: true, who: '신전이', text: '…전해 줘서 고마워, 후배.' },
  { kind: 'talk', bg: 'talk/m56/bg.webp', jeon: true, fade: true, who: '신전이', text: '덕분에 이 학교에서 보낸 시간이 참 따뜻했어. 이제 정말 졸업할게.' },
  {
    kind: 'reveal',
    img: 'talk/m56/jeon-real.webp',
    fallback: G('26'),
    text: '신전이는 오랫동안 56주년 기념관 앞을 지켜 온 학교 고양이였습니다.',
    sub: '그리고 얼마 전, 고양이별로 졸업했습니다.',
  },
  { kind: 'story', img: G('03'), text: '학교 곳곳에는 우리가 미처 알지 못한 작은 존재들이 함께 살고 있어요.' },
  { kind: 'story', img: G('12'), text: '신전이처럼 스쳐 가는 인연일 수도 있지만, 누군가에게는 오래 남는 추억이 되기도 하죠.' },
  { kind: 'story', img: G('16'), text: '사람도, 고양이도 서로 불편하지 않은 학교였으면 하는 마음으로 이 이야기를 만들었어요.' },
  { kind: 'story', img: G('21'), text: '우리 학교가 그냥 지나치는 곳이 아니라, 추억과 청춘이 머무는 곳이 되기를.' },
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
    return () => tl.kill()
  }, [i, s.fade])

  // 장면별 음악
  useEffect(() => {
    if (s.kind === 'note' || s.kind === 'talk') playBgm('sad', undefined, 2)
    if (s.kind === 'story') playBgm('piano', undefined, 2.5)
  }, [s.kind])
  useEffect(() => () => stopBgm(1.5), [])

  const next = useCallback(() => {
    if (lockRef.current || i >= list.length - 1) return
    playSfx('tick')
    gsap.to(rootRef.current.querySelectorAll('.fin__scene'), {
      opacity: 0,
      duration: 0.6,
      onComplete: () => setI((n) => n + 1),
    })
  }, [i, list.length])

  // 가만히 있어도 천천히 넘어감
  useEffect(() => {
    if (s.kind === 'end') return
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

        {s.kind === 'reveal' && (
          <div className="fin__reveal">
            <img className="fin__photo" src={BASE + s.img} alt="" onError={(e) => (e.currentTarget.src = BASE + s.fallback)} />
            <p className="fin__line fin__big">{s.text}</p>
            <p className="fin__line fin__small">{s.sub}</p>
          </div>
        )}

        {s.kind === 'story' && (
          <>
            <img className="fin__bg is-photo" src={BASE + s.img} alt="" />
            <div className="fin__shade" />
            <p className="fin__line fin__story">{s.text}</p>
          </>
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
