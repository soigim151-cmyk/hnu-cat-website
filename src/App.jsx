import { lazy, Suspense, useEffect, useState } from 'react'
import StartPage from './pages/StartPage.jsx'
import CampusLoader from './components/CampusLoader.jsx'

// 3D 캠퍼스 페이지는 용량이 커서 필요할 때 따로 불러옵니다.
// (시작 페이지가 열린 뒤 백그라운드에서 미리 받아둡니다)
const CampusPage = lazy(() => import('./pages/CampusPage.jsx'))

// 전시용: 아무 조작이 없으면 이 시간 뒤 처음(시작 페이지)으로 돌아감
const IDLE_RESET_MS = 3 * 60 * 1000

// 페이지 전환: 'start' → 'campus'
// 시작 페이지가 퇴장 애니메이션을 끝낸 뒤 onEnterCampus를 호출합니다.
export default function App() {
  const [page, setPage] = useState('start')

  // 3분 동안 마우스·키보드·터치·휠 입력이 없으면 시작 페이지로
  useEffect(() => {
    if (page === 'start') return
    let t
    const reset = () => {
      clearTimeout(t)
      t = setTimeout(() => setPage('start'), IDLE_RESET_MS)
    }
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(t)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [page])

  if (page === 'start') return <StartPage onEnterCampus={() => setPage('campus')} />

  return (
    // 3D 페이지 코드를 받는 동안에도 같은 로딩 화면을 보여줍니다
    <Suspense fallback={<main className="campus"><CampusLoader /></main>}>
      <CampusPage onBack={() => setPage('start')} />
    </Suspense>
  )
}
