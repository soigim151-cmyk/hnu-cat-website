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

  // 드래그 안내: 캠퍼스가 나타나면 잠깐 보여주고, 처음 드래그하거나 6초 지나면 사라짐
  const [dragHint, setDragHint] = useState(false)
  useEffect(() => {
    if (!revealed) return
    const show = setTimeout(() => setDragHint(true), 900)
    const hide = setTimeout(() => setDragHint(false), 6900)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [revealed])
  // 드래그를 시작하면 안내 숨김
  const handleDragChange = useCallback((d) => {
    setDragging(d)
    if (d) setDragHint(false)
  }, [])

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
      <section className="campus__map">
      <div ref={stageRef} className={`campus__stage${dragging ? ' is-dragging' : ''}${pointing ? ' is-pointing' : ''}`}>
        {/* 지도 뒤 고양이 장식 (지도와 함께 나타남) */}
        <img className="campus__deco-cat" src={`${import.meta.env.BASE_URL}images/deco/map_deco1.webp`} alt="" aria-hidden="true" />
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
                onDragChange={handleDragChange}
                dragging={dragging}
                onSelectBuilding={setSelectedBuilding}
                onPointingChange={setPointing}
              />
            ) : (
              <CampusScene
                url={CAMPUS_MODEL_URL}
                onReady={handleReady}
                onDragChange={handleDragChange}
                dragging={dragging}
                onSelectBuilding={setSelectedBuilding}
                onPointingChange={setPointing}
              />
            )}
          </Suspense>
        </Canvas>
      </div>

      <CampusLoader ready={ready} hidden={revealed} onDone={handleLoaderDone} />

      <div className={`campus__drag-hint${dragHint ? ' is-shown' : ''}`} aria-hidden="true">
        <span className="campus__drag-icon">
          <span>‹</span>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V12m0-.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L5 16.5a1.6 1.6 0 0 1 2.4-2.1L8 15" />
          </svg>
          <span>›</span>
        </span>
        드래그해서 둘러보기
      </div>

      {/* 아래 화면(고양이 갤러리)으로 이동 */}
      <button
        type="button"
        className={`campus__to-gallery${revealed ? ' is-shown' : ''}`}
        onClick={() => document.getElementById('cat-gallery')?.scrollIntoView({ behavior: 'smooth' })}
      >
        고양이 사진 보기 ↓
      </button>
      </section>

      {revealed && <CatGallery />}
    </main>
  )
}
