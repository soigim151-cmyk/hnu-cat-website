import { lazy, Suspense, useState } from 'react'
import StartPage from './pages/StartPage.jsx'
import CampusLoader from './components/CampusLoader.jsx'

// 3D 캠퍼스 페이지는 용량이 커서 필요할 때 따로 불러옵니다.
// (시작 페이지가 열린 뒤 백그라운드에서 미리 받아둡니다)
const CampusPage = lazy(() => import('./pages/CampusPage.jsx'))

// 페이지 전환: 'start' → 'campus'
// 시작 페이지가 퇴장 애니메이션을 끝낸 뒤 onEnterCampus를 호출합니다.
export default function App() {
  const [page, setPage] = useState('start')

  if (page === 'start') return <StartPage onEnterCampus={() => setPage('campus')} />

  return (
    // 3D 페이지 코드를 받는 동안에도 같은 로딩 화면을 보여줍니다
    <Suspense fallback={<main className="campus"><CampusLoader /></main>}>
      <CampusPage />
    </Suspense>
  )
}
