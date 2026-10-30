import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import gsap from 'gsap'
import CampusScene from '../components/CampusScene.jsx'
import MapScene from '../components/MapScene.jsx'
import { VIEW_MODE } from '../components/viewMode.js'
import { CAMPUS_MODEL_URL } from '../components/campusModel.js'
import CampusLoader from '../components/CampusLoader.jsx'
import CatGallery from '../components/CatGallery.jsx'
import './CampusPage.css'

export default function CampusPage() {
  const stageRef = useRef(null)
  const [ready, setReady] = useState(false) // 3D 모델 준비 완료
  const [revealed, setRevealed] = useState(false) // 로딩 화면이 끝나고 캠퍼스 등장
  const [dragging, setDragging] = useState(false)
  const [pointing, setPointing] = useState(false) // 건물 위에 마우스가 있음
  // 선택한 건물 (대화창 디자인이 나오면 여기서 대화창을 엽니다)
  const [, setSelectedBuilding] = useState(null)

  const mainRef = useRef(null)
  const hitTestRef = useRef(null) // 지도 그림 위인지 판정 (MapScene 제공)
  const galleryRef = useRef(null) // 갤러리 hover/열기 (CatGallery 제공)
  const downRef = useRef(null)
  const [overGallery, setOverGallery] = useState(false)

  // 배경: 시작 페이지 아이보리 → 검정으로 부드럽게
  useLayoutEffect(() => {
    const t = gsap.fromTo(mainRef.current, { backgroundColor: '#f1edea' }, { backgroundColor: '#000000', duration: 1.2, ease: 'power2.inOut' })
    return () => t.kill()
  }, [])

  // 지도는 앞, 갤러리는 뒤에 겹쳐 있어서 "지도 그림이 없는 곳"의 마우스 동작을 갤러리로 전달
  const overMap = (e) => e.target.closest?.('.map-marker') || pointing || hitTestRef.current?.(e.clientX, e.clientY)
  const handleMove = (e) => {
    if (e.pointerType !== 'mouse' || dragging) return
    const g = overMap(e) ? galleryRef.current?.hoverAt(null) : galleryRef.current?.hoverAt(e.clientX, e.clientY)
    setOverGallery(!!g)
  }
  const handleClick = (e) => {
    const d = downRef.current
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return // 드래그였음
    if (overMap(e)) return
    galleryRef.current?.openAt(e.clientX, e.clientY)
  }

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
    <main className="campus" ref={mainRef}>
      <section className="campus__map">
      {/* 고양이 갤러리 띠: 지도 아래쪽에 겹쳐서 뒤에 깔림 */}
      {revealed && <CatGallery apiRef={galleryRef} />}

      <div
        ref={stageRef}
        className={`campus__stage${dragging ? ' is-dragging' : ''}${pointing ? ' is-pointing' : ''}${
          overGallery && !dragging ? ' is-gallery' : ''
        }`}
        onPointerDown={(e) => (downRef.current = { x: e.clientX, y: e.clientY })}
        onPointerMove={handleMove}
        onPointerLeave={() => {
          galleryRef.current?.hoverAt(null)
          setOverGallery(false)
        }}
        onClick={handleClick}
      >
        <Canvas
          frameloop="demand" // 움직임이 있을 때만 다시 그림 (배터리·발열 절약)
          dpr={[1, 1.75]} // 고해상도 화면에서도 최대 1.75배까지만
          flat // 톤매핑 끔 → 텍스처 원래 색 그대로
          gl={{ antialias: true, alpha: true, toneMapping: NoToneMapping }}
          camera={{ fov: 28, position: [0, 1, 1] }}
          resize={{ offsetSize: true }} // 등장 애니메이션의 scale 이 캔버스 크기 계산에 끼어들지 않도록
        >
          <Suspense fallback={null}>
            {VIEW_MODE === 'map' ? (
              <MapScene
                onReady={handleReady}
                onDragChange={setDragging}
                dragging={dragging}
                onSelectBuilding={setSelectedBuilding}
                onPointingChange={setPointing}
                hitTestRef={hitTestRef}
              />
            ) : (
              <CampusScene
                url={CAMPUS_MODEL_URL}
                onReady={handleReady}
                onDragChange={setDragging}
                dragging={dragging}
                onSelectBuilding={setSelectedBuilding}
                onPointingChange={setPointing}
              />
            )}
          </Suspense>
        </Canvas>
      </div>

      <CampusLoader ready={ready} hidden={revealed} onDone={handleLoaderDone} />

      </section>
    </main>
  )
}
