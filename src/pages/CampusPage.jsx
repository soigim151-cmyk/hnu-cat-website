import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import gsap from 'gsap'
import CampusScene from '../components/CampusScene.jsx'
import MapScene from '../components/MapScene.jsx'
import { VIEW_MODE } from '../components/viewMode.js'
import { CAMPUS_MODEL_URL } from '../components/campusModel.js'
import CampusLoader from '../components/CampusLoader.jsx'
import CatGallery from '../components/CatGallery.jsx'
import DialogScene from '../components/DialogScene.jsx'
import CastScene from '../components/CastScene.jsx'
import { DIALOGUES } from '../data/dialogues.js'
import { BUILDINGS } from '../data/buildings.js'
import { STORY, ITEMS } from '../data/story.js'
import { QuestBar, Inventory, ItemViewer, Confirm, PlaceNote, Toast } from '../components/StoryUI.jsx'
import './CampusPage.css'

export default function CampusPage({ onBack }) {
  const stageRef = useRef(null)
  const [ready, setReady] = useState(false) // 3D 모델 준비 완료
  const [revealed, setRevealed] = useState(false) // 로딩 화면이 끝나고 캠퍼스 등장
  const [dragging, setDragging] = useState(false)
  const [pointing, setPointing] = useState(false) // 건물 위에 마우스가 있음
  // ── 스토리 진행 (저장하지 않음: 처음으로 가거나 3분 방치하면 초기화) ──
  const [done, setDone] = useState([]) // 이야기를 끝낸 장소 id (순서대로)
  const [items, setItems] = useState({}) // 보관함: { 아이템 id: 'have' | 'used' }
  const [bagNew, setBagNew] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [confirmBack, setConfirmBack] = useState(false)
  const [note, setNote] = useState(null) // 아직 대화가 없는 장소의 안내 창
  const [toast, setToast] = useState(null)
  const doneIds = useMemo(() => new Set(done), [done])
  const stepNow = done.length
  const nextId = STORY[stepNow]?.id ?? null
  const nextB = BUILDINGS.find((b) => b.id === nextId)
  const nameOf = (b) => (b.number ? `${b.name} (${b.number}번)` : b.name)
  // 받침이 있으면 '이', 없으면 '가'
  const iga = (w) => {
    const c = w.charCodeAt(w.length - 1) - 0xac00
    return c >= 0 && c < 11172 && c % 28 ? '이' : '가'
  }

  // 알림: 새 알림이 오면 이전 알림(과 이어서 띄우려던 알림)은 취소
  const toastTimer = useRef(null)
  const laterTimer = useRef(null)
  const showToast = useCallback((t, ms = 2600, then) => {
    clearTimeout(toastTimer.current)
    clearTimeout(laterTimer.current)
    setToast(t)
    toastTimer.current = setTimeout(() => setToast(null), ms)
    if (then) {
      laterTimer.current = setTimeout(() => {
        setToast(then)
        toastTimer.current = setTimeout(() => setToast(null), 2600)
      }, ms + 200)
    }
  }, [])
  useEffect(
    () => () => {
      clearTimeout(toastTimer.current)
      clearTimeout(laterTimer.current)
    },
    [],
  )

  // 장소 이야기를 끝까지 봄 → 다음 장소 열기 + 아이템
  const finishPlace = useCallback(
    (id) => {
      if (id !== nextId) return // 이미 끝낸 장소를 다시 본 경우
      const st = STORY[stepNow]
      setDone((d) => [...d, id])
      if (st.get?.length || st.use?.length) {
        setItems((m) => {
          const n = { ...m }
          st.get?.forEach((k) => (n[k] = 'have'))
          st.use?.forEach((k) => n[k] && (n[k] = 'used'))
          return n
        })
      }
      const got = st.get?.[0] && ITEMS[st.get[0]]
      const after = STORY[stepNow + 1] && BUILDINGS.find((b) => b.id === STORY[stepNow + 1].id)
      if (got) {
        setBagNew(true)
        showToast(
          { img: got.img, text: `보관함에 ${got.name}${iga(got.name)} 들어왔어요!` },
          3200,
          after && { text: `다음 장소가 열렸어요: ${nameOf(after)}` },
        )
      } else if (after) showToast({ text: `다음 장소가 열렸어요: ${nameOf(after)}` })
      else showToast({ text: '모든 이야기를 완료했어요!' }, 3600)
    },
    [nextId, stepNow, showToast],
  )

  // 선택한 장소 → 대화가 있으면 대화 화면, 없으면 짧은 안내
  const [talk, setTalk] = useState(null) // { id, dialog }
  const setSelectedBuilding = useCallback((b) => {
    if (!b) return
    if (DIALOGUES[b.id]) setTalk({ id: b.id, dialog: DIALOGUES[b.id] })
    else setNote(b)
  }, [])
  // 순서가 아닌 장소를 누름
  const handleLocked = useCallback(
    (b) => {
      if (nextB) showToast({ text: `아직 ${b.name}에는 갈 수 없어요. 지금은 ${nameOf(nextB)} 차례예요!` })
    },
    [nextB, showToast],
  )
  const closeTalk = useCallback(
    (completed) => {
      const id = talk?.id
      setTalk(null)
      if (completed === true && id) finishPlace(id)
    },
    [talk, finishPlace],
  )

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
      {/* 처음(시작 페이지)으로 돌아가기 */}
      <button type="button" className={`campus__back${revealed ? ' is-shown' : ''}`} onClick={() => setConfirmBack(true)} aria-label="처음으로 돌아가기">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        처음으로
      </button>
      <section className="campus__map">
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
            {VIEW_MODE === 'map' ? (
              <MapScene
                onReady={handleReady}
                onDragChange={handleDragChange}
                dragging={dragging}
                onSelectBuilding={setSelectedBuilding}
                onPointingChange={setPointing}
                nextId={nextId}
                doneIds={doneIds}
                onLockedClick={handleLocked}
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

      {/* 스토리 UI */}
      <QuestBar step={stepNow} total={STORY.length} place={nextB && nameOf(nextB)} shown={revealed && !talk} />
      <Inventory
        items={items}
        isNew={bagNew}
        shown={revealed && !talk}
        onOpen={() => setBagNew(false)}
        onPick={setViewItem}
      />
      <Toast toast={talk ? null : toast} />
      {viewItem && <ItemViewer id={viewItem} state={items[viewItem]} onClose={() => setViewItem(null)} />}
      {note && (
        <PlaceNote
          name={nameOf(note)}
          note={STORY.find((s) => s.id === note.id)?.note}
          onDone={() => {
            setNote(null)
            finishPlace(note.id)
          }}
        />
      )}
      {confirmBack && (
        <Confirm
          title="처음 화면으로 돌아갈까요?"
          desc="지금까지 진행한 이야기와 보관함 아이템은 저장되지 않고 모두 사라져요."
          no="계속하기"
          yes="처음으로"
          onNo={() => setConfirmBack(false)}
          onYes={onBack}
        />
      )}

      {talk &&
        (talk.dialog.cast ? (
          <CastScene dialog={talk.dialog} onClose={closeTalk} />
        ) : (
          <DialogScene dialog={talk.dialog} onClose={closeTalk} />
        ))}
    </main>
  )
}
