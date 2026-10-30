import { useEffect, useState, useSyncExternalStore } from 'react'
import { getDownloadProgress, subscribeDownload } from './downloadProgress.js'
import './CampusLoader.css'

// 로딩 화면: 고양이 실루엣이 아래에서 위로 채워집니다.
// - 다운로드는 0~90%, 화면에 띄울 준비까지 끝나면 100%
// - 로딩이 빨리 끝나도 최소 4초 동안 천천히 채워진 뒤 넘어갑니다.
// - 시간은 "화면에 실제로 그려진 시간"만 셉니다. 3D 모델을 올리느라 화면이
//   잠깐 멈춰도 그동안은 진행되지 않아, 항상 0%부터 차오르는 모습이 보입니다.
const CAT = `${import.meta.env.BASE_URL}images/loading-cat.png`
const MIN_DURATION = 4000 // ms: 고양이가 0→100% 차오르는 최소 시간
const MAX_FRAME_STEP = 50 // ms: 한 프레임에 셀 수 있는 최대 시간 (멈춤 구간 무시)
const HOLD_FULL = 350 // ms: 다 채워진 고양이를 보여주는 시간

// 3D 코드 로딩 중 화면과 캠퍼스 페이지의 로딩 화면이 같은 시계를 쓰도록 공유
let elapsed = 0

export default function CampusLoader({ ready = false, hidden = false, onDone }) {
  const downloaded = useSyncExternalStore(subscribeDownload, getDownloadProgress)
  const [timeProgress, setTimeProgress] = useState(() => Math.min(1, elapsed / MIN_DURATION))

  // 시간 진행률: 0 → 1 (4초, 그려진 프레임 기준)
  useEffect(() => {
    let raf
    let last = null
    const tick = (now) => {
      if (last !== null) elapsed += Math.min(now - last, MAX_FRAME_STEP)
      last = now
      const t = Math.min(1, elapsed / MIN_DURATION)
      setTimeProgress(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 실제 로딩과 시간 중 더 느린 쪽을 따라 채워짐
  const actual = ready ? 1 : downloaded * 0.9
  const shown = Math.min(actual, timeProgress)
  const percent = Math.round(shown * 100)
  const full = shown >= 1

  useEffect(() => {
    if (!full) return
    const t = setTimeout(() => {
      elapsed = 0 // 다음 로딩을 위해 초기화
      onDone?.()
    }, HOLD_FULL)
    return () => clearTimeout(t)
  }, [full, onDone])

  return (
    <div className={`campus__loader${hidden ? ' is-hidden' : ''}`} role="status" aria-live="polite">
      <div className="campus__loader-cat" aria-hidden="true">
        <img className="campus__loader-cat-empty" src={CAT} alt="" />
        <img
          className="campus__loader-cat-fill"
          src={CAT}
          alt=""
          style={{ clipPath: `inset(${100 - percent}% 0 0 0)` }}
        />
      </div>
      <span className="campus__loader-text">캠퍼스로 등교 중 {percent}%</span>
    </div>
  )
}
