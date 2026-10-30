import { useEffect, useState, useSyncExternalStore } from 'react'
import { getDownloadProgress, subscribeDownload } from './downloadProgress.js'
import './CampusLoader.css'

// 로딩 화면: 고양이 실루엣이 아래에서 위로 채워집니다.
// - 다운로드는 0~90%, 화면에 띄울 준비까지 끝나면 100%
// - 로딩이 빨리 끝나도 최소 3초 동안 천천히 채워진 뒤 넘어갑니다.
const CAT = `${import.meta.env.BASE_URL}images/loading-cat.png`
const MIN_DURATION = 3000 // ms: 로딩 화면 최소 표시 시간
const HOLD_FULL = 350 // ms: 다 채워진 고양이를 보여주는 시간

// 3D 코드 로딩 중 화면과 캠퍼스 페이지의 로딩 화면이 같은 시계를 쓰도록 공유
let startedAt = null

export default function CampusLoader({ ready = false, hidden = false, onDone }) {
  const downloaded = useSyncExternalStore(subscribeDownload, getDownloadProgress)
  const [timeProgress, setTimeProgress] = useState(0)

  // 시간 진행률: 0 → 1 (3초)
  useEffect(() => {
    if (startedAt === null) startedAt = performance.now()
    let raf
    const tick = () => {
      const t = Math.min(1, (performance.now() - startedAt) / MIN_DURATION)
      setTimeProgress(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    tick()
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
      startedAt = null // 다음 로딩을 위해 초기화
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
