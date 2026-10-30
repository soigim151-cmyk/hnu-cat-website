import { useSyncExternalStore } from 'react'
import { getDownloadProgress, subscribeDownload } from './downloadProgress.js'
import './CampusLoader.css'

// 로딩 화면: 고양이 실루엣이 아래에서 위로 채워집니다.
// 다운로드는 0~90%, 화면에 띄울 준비(압축 해제 등)가 끝나면 100%
const CAT = `${import.meta.env.BASE_URL}images/loading-cat.png`

export default function CampusLoader({ visible = true }) {
  const downloaded = useSyncExternalStore(subscribeDownload, getDownloadProgress)
  const progress = visible ? downloaded * 0.9 : 1
  const percent = Math.round(progress * 100)
  return (
    <div className={`campus__loader${visible ? '' : ' is-hidden'}`} role="status" aria-live="polite">
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
