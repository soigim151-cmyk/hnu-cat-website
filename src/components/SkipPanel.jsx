// 대화 건너뛰기: 그 장소 이야기를 한 문장으로 정리 + 장소 정보
import { playSfx } from './sfx.js'
import './SkipPanel.css'

// 오른쪽 위 [SKIP ▶▶] 버튼
export function SkipButton({ onClick, hidden }) {
  return (
    <button
      type="button"
      className="skip__btn"
      style={hidden ? { opacity: 0, pointerEvents: 'none' } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        playSfx('pop')
        onClick()
      }}
      aria-label="대화 건너뛰기"
    >
      SKIP ▶▶
    </button>
  )
}

// 정리 창: 계속 보기 / 건너뛰기
export function SkipPanel({ place, summary, onCancel, onSkip }) {
  return (
    <div className="skip" role="dialog" aria-modal="true" aria-label={`${place} 요약`} onClick={(e) => e.stopPropagation()}>
      <div className="skip__card">
        <p className="skip__kicker">STORY SKIP</p>
        <h2 className="skip__place">{summary.name || place}</h2>
        <p className="skip__story">{summary.story}</p>
        <div className="skip__info">
          <p className="skip__info-title">장소 정보</p>
          <ul>
            {summary.info.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="skip__actions">
          <button type="button" className="skip__action" onClick={onCancel}>
            계속 보기
          </button>
          <button type="button" className="skip__action is-main" onClick={onSkip}>
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  )
}
