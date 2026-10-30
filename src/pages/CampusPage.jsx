import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import gsap from 'gsap'
import CampusScene from '../components/CampusScene.jsx'
import { CAMPUS_MODEL_URL } from '../components/campusModel.js'
import CampusLoader from '../components/CampusLoader.jsx'
import './CampusPage.css'

export default function CampusPage() {
  const stageRef = useRef(null)
  const [ready, setReady] = useState(false) // 3D 모델 준비 완료
  const [revealed, setRevealed] = useState(false) // 로딩 화면이 끝나고 캠퍼스 등장
  const [dragging, setDragging] = useState(false)
  const [pointing, setPointing] = useState(false) // 건물 위에 마우스가 있음
  // 선택한 건물 (대화창 디자인이 나오면 여기서 대화창을 엽니다)
  const [, setSelectedBuilding] = useState(null)

  const handleReady = useCallback(() => setReady(true), [])
  const handleLoaderDone = useCallback(() => setRevealed(true), [])

  // 등장 전 상태: 투명 + 살짝 작게
  useLayoutEffect(() => {
    gsap.set(stageRef.current, { opacity: 0, scale: 0.94 })
  }, [])

  // 로딩 화면이 끝나면(최소 3초) → 부드럽게 등장
  useEffect(() => {
    if (!revealed) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tween = gsap.to(stageRef.current, {
      opacity: 1,
      scale: 1,
      duration: reduce ? 0.3 : 1.1,
      ease: 'expo.out',
    })
    return () => tween.kill()
  }, [revealed])

  return (
    <main className="campus">
      <div ref={stageRef} className={`campus__stage${dragging ? ' is-dragging' : ''}${pointing ? ' is-pointing' : ''}`}>
        <Canvas
          frameloop="demand" // 움직임이 있을 때만 다시 그림 (배터리·발열 절약)
          dpr={[1, 1.75]} // 고해상도 화면에서도 최대 1.75배까지만
          flat // 톤매핑 끔 → 텍스처 원래 색 그대로
          gl={{ antialias: true, alpha: true, toneMapping: NoToneMapping }}
          camera={{ fov: 28, position: [0, 1, 1] }}
          resize={{ offsetSize: true }} // 등장 애니메이션의 scale 이 캔버스 크기 계산에 끼어들지 않도록
        >
          <Suspense fallback={null}>
            <CampusScene
              url={CAMPUS_MODEL_URL}
              onReady={handleReady}
              onDragChange={setDragging}
              dragging={dragging}
              onSelectBuilding={setSelectedBuilding}
              onPointingChange={setPointing}
            />
          </Suspense>
        </Canvas>
      </div>

      <CampusLoader ready={ready} hidden={revealed} onDone={handleLoaderDone} />
    </main>
  )
}
