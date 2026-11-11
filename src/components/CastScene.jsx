import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { playSfx } from './sfx.js'
import FlyerGame from './FlyerGame.jsx'
import { RewardPop } from './DialogScene.jsx'
import './DialogScene.css'
import './CastScene.css'

const BASE = import.meta.env.BASE_URL
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000))
// 장면(배경+인물) 단위: 1440×1021 장면이 화면을 꽉 채우도록 (CSS .cast__world 의 --u 와 같은 값)
const unitPx = () => Math.max(window.innerWidth / 1440, window.innerHeight / 1021)
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

// 여러 인물이 나오는 대화 화면 (린튼공원 · 학생회관 등)
// 장소 안내 → 클릭마다: before 연출 → 대사 타이핑 → after 연출(자동)
// 대사 줄 옵션: label(이름표) · next(다음에 갈 label) · choices(선택지) · tap(인물 아이콘을 눌러 시작)
//              auto(다음 줄 자동) · setup(이 줄부터 다시 시작할 때 무대 준비) · checkpoint(닫았을 때 다시 시작할 위치)
// onClose(끝까지 봤는지, 다시 시작할 label)
export default function CastScene({ dialog, onClose, startAt }) {
  const rootRef = useRef(null)
  const curtainRef = useRef(null)
  const worldRef = useRef(null)
  const boxRef = useRef(null)
  const nameRef = useRef(null)
  const charRefs = useRef({})
  const photoRef = useRef(null)
  const bagRef = useRef(null)
  const typingRef = useRef(null)
  const finishRef = useRef(null)
  const waitClickRef = useRef(null)
  const busyRef = useRef(true)
  const aliveRef = useRef(true)
  const camRef = useRef({ zoom: 1, x: 0, y: 0 })
  const revealedRef = useRef({})
  const resumeRef = useRef(null) // 닫으면 다음에 여기서부터
  const gameResRef = useRef(null)
  const itemResRef = useRef(null)
  const propRefs = useRef({})

  const [step, setStep] = useState(-1)
  const [typed, setTyped] = useState(0)
  const [box, setBox] = useState(false)
  const [ready, setReady] = useState(false)
  const [label, setLabel] = useState('')
  const [poses, setPoses] = useState({}) // 인물 → 자세 (없으면 안 보임)
  const [poseDur, setPoseDur] = useState({})
  const [srcs, setSrcs] = useState({}) // '인물/자세' → 이미지 주소
  const [bgKey, setBgKey] = useState(dialog.startBg)
  const [bgSrcs, setBgSrcs] = useState({})
  const [photoOpen, setPhotoOpen] = useState(false)
  const [photoSrc, setPhotoSrc] = useState(dialog.photo ? BASE + dialog.photo.fallback : null)
  const [msgs, setMsgs] = useState(null) // 메신저 [{from,text}] (보이는 것만)
  const [profile, setProfile] = useState(null) // NEW CHARACTER 카드
  const [bagOn, setBagOn] = useState(false)
  const [complete, setComplete] = useState(null)
  const [bagSrc, setBagSrc] = useState(null)
  const [boxOff, setBoxOff] = useState(false) // 대화창 잠깐 숨김
  const [tapOn, setTapOn] = useState(null) // 말 걸기 아이콘이 뜬 인물
  const [choices, setChoices] = useState(null)
  const [walkers, setWalkers] = useState(false) // 배경을 오가는 학생들
  const [passers, setPassers] = useState(0) // 앞을 지나가는 학생들 (번호가 바뀌면 다시 재생)
  const [bubbles, setBubbles] = useState({}) // 인물 머리 위 작은 말풍선
  const [propsOn, setPropsOn] = useState({}) // 소품 (홍보물 · 가방 · 김밥)
  const [game, setGame] = useState(false)
  const [itemGet, setItemGet] = useState(null)
  const [reward, setReward] = useState(null) // 학생증 등 획득 카드

  const lines = dialog.lines
  const labelIdx = useMemo(() => {
    const m = {}
    lines.forEach((l, i) => l.label && (m[l.label] = i))
    return m
  }, [lines])
  const nextOf = (i) => (lines[i].next ? labelIdx[lines[i].next] : i + 1)
  const line = step < 0 ? { text: dialog.place, place: true } : lines[step]
  // 대화창 좌우 반전: 메인 캐릭터가 아닌 대사. 단, 다른 인물이 말하기 전 플레이어 독백은 그대로
  const talked = step > 0 && lines.slice(0, step).some((l) => l.who && l.who !== 'me')
  const flip = line.who && !dialog.main?.includes(dialog.cast[line.who]?.as || line.who) && (line.who !== 'me' || talked)
  // 마지막으로 말한 인물 (플레이어 대사는 건너뜀) → 다른 인물이 말할 때까지 강조 유지
  let focusWho = null
  for (let i = step; i >= 0; i--) {
    if (lines[i].who && dialog.cast[lines[i].who]) {
      focusWho = dialog.cast[lines[i].who].as || lines[i].who
      break
    }
  }
  const full = line.text

  const nameOf = (who) => {
    if (!who) return ''
    if (who === 'me') return '나'
    const c = dialog.cast[who]
    return c.known || revealedRef.current[who] ? c.name : '???'
  }

  // ── 이미지 미리 확인 (없는 건 임시 이미지) ──
  useEffect(() => {
    let off = false
    const need = {}
    for (const l of lines)
      for (const a of [...(l.before || []), ...(l.after || [])]) {
        if (a.show) need[`${a.show}/${a.pose}`] = true
        if (a.pose && a.p) need[`${a.pose}/${a.p}`] = true
      }
    Object.keys(need).forEach((k) => {
      const [who, p] = k.split('/')
      const c = dialog.cast[who]
      const url = `${BASE}${c.folder}${p}.png`
      const img = new Image()
      img.onload = () => !off && setSrcs((m) => ({ ...m, [k]: url }))
      img.onerror = () => !off && setSrcs((m) => ({ ...m, [k]: BASE + c.fallback }))
      img.src = url
    })
    // 배경 · 사진
    Object.entries(dialog.bgs).forEach(([key, b]) => {
      const img = new Image()
      img.onload = () => !off && setBgSrcs((m) => ({ ...m, [key]: { src: BASE + b.src } }))
      img.onerror = () => !off && setBgSrcs((m) => ({ ...m, [key]: { src: BASE + (b.fallback || b.src), pos: b.fallbackPos } }))
      img.src = BASE + b.src
    })
    if (dialog.bagImg) {
      const bi = new Image()
      bi.onload = () => !off && setBagSrc(BASE + dialog.bagImg.src)
      bi.src = BASE + dialog.bagImg.src
    }
    if (dialog.photo) {
      const ph = new Image()
      ph.onload = () => !off && setPhotoSrc(BASE + dialog.photo.src)
      ph.src = BASE + dialog.photo.src
    }
    return () => {
      off = true
    }
  }, [lines, dialog])

  // ── 타이핑 ──
  const typeLine = useCallback(
    (text) =>
      new Promise((resolve) => {
        let n = 0
        setTyped(0)
        clearInterval(typingRef.current)
        const end = () => {
          clearInterval(typingRef.current)
          typingRef.current = null
          finishRef.current = null
          setTyped(text.length)
          resolve()
        }
        finishRef.current = end
        typingRef.current = setInterval(() => {
          n += 1
          setTyped(n)
          if (n >= text.length) end()
        }, dialog.typeSpeed ?? 35)
      }),
    [dialog.typeSpeed],
  )

  // ── 카메라 ──
  const camTo = useCallback((o) => {
    const world = worldRef.current
    const c = camRef.current
    const u = unitPx()
    const zoom = o.zoom ?? c.zoom
    let x = (o.x ?? 0) * u
    let y = 0
    if (o.on && charRefs.current[o.on]) {
      // 그 인물(얼굴 쪽)을 중심으로 확대: 그 점이 제자리에 있도록 이동
      const el = charRefs.current[o.on]
      const px = el.offsetLeft + el.offsetWidth / 2 - world.offsetWidth / 2
      const py = el.offsetTop + el.offsetHeight * 0.3 - world.offsetHeight / 2
      x = -px * (zoom - 1)
      y = -py * (zoom - 1)
    }
    // 배경 가장자리(검은 부분)가 보이지 않을 만큼만 이동 (배경은 사방 2% 더 큼)
    const mx = Math.max(0, (world.offsetWidth * 1.04 * zoom - window.innerWidth) / 2 - 1)
    const my = Math.max(0, (world.offsetHeight * 1.04 * zoom - window.innerHeight) / 2 - 1)
    x = Math.min(mx, Math.max(-mx, x))
    y = Math.min(my, Math.max(-my, y))
    camRef.current = { zoom, x, y }
    return gsap.to(world, { scale: zoom, x, y, duration: o.dur ?? 0.6, ease: o.dur > 2 ? 'sine.inOut' : 'power2.inOut', overwrite: true })
  }, [])

  // ── 연출 명령 ──
  const run = useCallback(
    async (actions = []) => {
      for (const a of actions) {
        if (!aliveRef.current) return
        if (a.wait) await sleep(a.wait)
        else if (a.show) {
          const who = a.show
          setPoseDur((d) => ({ ...d, [who]: 0 }))
          setPoses((p) => ({ ...p, [who]: a.pose }))
          await nextFrame()
          const el = charRefs.current[who]
          const dur = a.dur ?? 0.5
          const from = {
            fade: { opacity: 0 },
            bottom: { opacity: 0, yPercent: 40 },
            left: { opacity: 0, xPercent: -40 },
            right: { opacity: 0, xPercent: 40 },
            back: { opacity: 0, scale: 0.72, yPercent: -12 }, // 멀리서 다가오는 느낌
          }[a.from || 'fade']
          const t = gsap.fromTo(el, from, { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, duration: dur, ease: a.from === 'back' ? 'power1.out' : 'power2.out' })
          if (a.wait !== false) await t
        } else if (a.pose && a.p) {
          setPoseDur((d) => ({ ...d, [a.pose]: a.dur ?? 0.3 }))
          setPoses((p) => ({ ...p, [a.pose]: a.p }))
          await sleep(a.dur ?? 0.3)
        } else if (a.hide) {
          const el = charRefs.current[a.hide]
          const to = { fade: {}, left: { xPercent: -140 }, right: { xPercent: 120 } }[a.to || 'fade']
          const t = gsap.to(el, { ...to, opacity: 0, duration: a.dur ?? 0.6, ease: 'power2.in' })
          if (a.wait !== false) await t
        } else if (a.move) {
          const el = charRefs.current[a.move]
          const u = unitPx()
          await gsap.to(el, { x: `+=${a.x * u}`, duration: a.dur ?? 0.6, ease: 'power2.inOut' })
        } else if (a.shake) {
          const el = a.shake === 'world' ? worldRef.current : charRefs.current[a.shake]
          await gsap.timeline().to(el, { rotation: -3, duration: 0.14 }).to(el, { rotation: 3, duration: 0.18 }).to(el, { rotation: -2, duration: 0.16 }).to(el, { rotation: 0, duration: 0.14 })
        } else if (a.cam) {
          const t = camTo(a.cam)
          if (a.cam.wait !== false) await t
        } else if (a.reveal) {
          const who = a.reveal
          revealedRef.current[who] = true
          playSfx('ding')
          if (nameRef.current) {
            await gsap.to(nameRef.current, { opacity: 0, duration: 0.1 })
            setLabel(dialog.cast[who].name)
            await gsap.to(nameRef.current, { opacity: 1, duration: 0.1 })
          }
          setProfile({ who, name: dialog.cast[who].name })
          await sleep(a.dur ?? 1.5)
          setProfile(null)
        } else if (a.photo) {
          if (a.photo === 'show') {
            setPhotoOpen(a.side || 'right')
            await nextFrame()
            const el = photoRef.current
            gsap.set(el.querySelector('img'), { scale: 1 })
            await gsap.fromTo(el, { opacity: 0, scale: 0.6, rotation: -14 }, { opacity: 1, scale: 1, rotation: -3, duration: 0.45, ease: 'back.out(1.7)' })
          } else if (a.photo === 'hide') {
            const el = photoRef.current
            if (el) await gsap.to(el, { opacity: 0, scale: 0.8, duration: 0.3, ease: 'power2.in' })
            setPhotoOpen(false)
          } else {
            // face: 시유 얼굴 1.5배, window: 창문 2배
            const [fx, fy] = dialog.photo[a.photo]
            const s = a.photo === 'window' ? 2 : 1.5
            const el = photoRef.current
            if (el) await gsap.to(el.querySelector('img'), { scale: s, transformOrigin: `${fx * 100}% ${fy * 100}%`, duration: 0.6, ease: 'power2.inOut' })
          }
        } else if (a.msg) {
          setMsgs([])
          for (let i = 0; i < a.msg.length; i++) {
            await sleep(i === 0 ? 0.3 : 0.7)
            playSfx('ding')
            setMsgs(a.msg.slice(0, i + 1))
          }
        } else if (a.msgHide) {
          setMsgs(null)
        } else if (a.bag) {
          if (a.bag === 'peek') {
            setBagOn(true)
            await nextFrame()
            await gsap.fromTo(bagRef.current, { yPercent: 100, x: 0, opacity: 1, scale: 1 }, { yPercent: 30, duration: 0.5, ease: 'back.out(1.6)' })
          } else if (a.bag === 'hide') {
            await gsap.to(bagRef.current, { yPercent: 100, duration: 0.4 })
            setBagOn(false)
          } else if (a.bag === 'give') {
            const bag = bagRef.current
            const target = charRefs.current.siyu
            const b = bag.getBoundingClientRect()
            const t = target.getBoundingClientRect()
            await gsap.to(bag, {
              yPercent: 0,
              x: t.left + t.width * 0.5 - (b.left + b.width / 2),
              y: t.top + t.height * 0.4 - (b.top + b.height / 2),
              scale: 0.6,
              duration: 0.7,
              ease: 'power2.inOut',
            })
            await gsap.to(bag, { opacity: 0, duration: 0.25 })
            setBagOn(false)
          }
        } else if (a.bg) {
          // 다음 배경을 위에 겹쳐 페이드 인 → 바꿔치기
          const layer = rootRef.current.querySelector('.cast__bg-next')
          const next = bgSrcsRef.current[a.bg]
          if (next) {
            layer.src = next.src
            layer.style.objectPosition = next.pos || ''
          }
          await gsap.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: a.dur ?? 0.7 })
          setBgKey(a.bg)
          await nextFrame()
          gsap.set(layer, { opacity: 0 })
        } else if (a.sfx) {
          playSfx(a.sfx)
        } else if (a.dark) {
          await gsap.to(rootRef.current.querySelector('.cast__dark'), { opacity: a.to ?? 0.75, duration: a.dark })
        } else if (a.reward) {
          // 획득 카드: 대화창을 치우고 튀어나옴 → 한 번 누르면 다음으로
          await gsap.to(boxRef.current, { opacity: 0, y: 16, duration: 0.25 })
          setReward({ src: a.reward, label: a.label })
          playSfx('complete')
          await new Promise((r) => (waitClickRef.current = r))
          await gsap.to(rootRef.current.querySelector('.dialog__reward'), { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' })
          setReward(null)
          await gsap.to(boxRef.current, { opacity: 1, y: 0, duration: 0.25 })
        } else if (a.walkers !== undefined) {
          setWalkers(a.walkers)
        } else if (a.passers) {
          setPassers((n) => n + 1)
          await sleep(a.dur ?? 2.2)
        } else if (a.bubble) {
          setBubbles((b) => ({ ...b, [a.bubble]: a.text }))
          await sleep(a.dur ?? 1)
          setBubbles((b) => ({ ...b, [a.bubble]: null }))
        } else if (a.prop) {
          const id = a.prop
          const p = dialog.props[id]
          if (a.do === 'show') {
            setPropsOn((m) => ({ ...m, [id]: true }))
            await nextFrame()
            const t = gsap.fromTo(propRefs.current[id], { opacity: 0, y: 20, x: 0, scale: 1 }, { opacity: 1, y: 0, duration: a.dur ?? 0.4, ease: 'power2.out' })
            if (a.wait !== false) await t
          } else if (a.do === 'hide') {
            const el = propRefs.current[id]
            if (el) await gsap.to(el, { opacity: 0, duration: a.dur ?? 0.3 })
            setPropsOn((m) => ({ ...m, [id]: false }))
          } else if (a.do === 'pulse') {
            const el = propRefs.current[id]
            if (el) await gsap.timeline().to(el, { scale: 1.2, duration: 0.18 }).to(el, { scale: 1, duration: 0.25 })
          } else if (a.to) {
            const el = propRefs.current[id]
            const u = unitPx()
            const t = el && gsap.to(el, { x: (a.to[0] - p.x) * u, y: -(a.to[1] - p.bottom) * u, scale: a.scale ?? 1, duration: a.dur ?? 0.8, ease: 'power2.inOut' })
            if (t && a.wait !== false) await t
          }
        } else if (a.boxOff !== undefined) {
          setBoxOff(a.boxOff)
          await nextFrame()
        } else if (a.game) {
          // 미니게임: 끝날 때까지 기다림
          setBoxOff(true)
          setGame(true)
          const res = await new Promise((r) => (gameResRef.current = r))
          setGame(false)
          if (res === 'quit') {
            aliveRef.current = false
            await gsap.to(rootRef.current, { opacity: 0, duration: 0.35 })
            onClose(false, a.game.quit)
            return
          }
          setBoxOff(false)
          await nextFrame()
        } else if (a.leave !== undefined) {
          // 끝까지 보지 않고 대화 종료 (다음에 a.leave 부터 다시)
          aliveRef.current = false
          await gsap.to(boxRef.current, { opacity: 0, y: 16, duration: 0.25 })
          await gsap.to(rootRef.current, { opacity: 0, duration: 0.35 })
          onClose(false, a.leave)
          return
        } else if (a.itemGet) {
          // 아이템 획득 화면 → 확인 누르면 끝
          setBoxOff(true)
          setItemGet(a.itemGet)
          await new Promise((r) => (itemResRef.current = r))
          aliveRef.current = false
          await gsap.to(rootRef.current, { opacity: 0, duration: 0.4 })
          onClose(true)
          return
        } else if (a.complete) {
          await gsap.to(boxRef.current, { opacity: 0, y: 16, duration: 0.25 })
          setComplete(a.complete)
          await new Promise((res) => (waitClickRef.current = res))
          await gsap.to(rootRef.current, { opacity: 0, duration: 0.4 })
          onClose(true) // 끝까지 봄
          return
        }
      }
    },
    [camTo, dialog, onClose],
  )

  const bgSrcsRef = useRef({})
  useEffect(() => {
    bgSrcsRef.current = bgSrcs
  }, [bgSrcs])

  // ── 한 줄 진행 ──
  const curtainUp = useRef(false)
  const play = useCallback(
    async (i, first = false) => {
      busyRef.current = true
      setReady(false)
      const l = lines[i]
      if (!curtainUp.current && curtainRef.current) {
        curtainUp.current = true
        if (first && l.setup) await run(l.setup) // 중간부터 다시 시작: 무대 준비
        await gsap.to(curtainRef.current, { opacity: 0, duration: 0.8, ease: 'power1.inOut' })
      }
      if (l.checkpoint) resumeRef.current = l.checkpoint
      if (l.tap) {
        // 대화창 없이 인물 머리 위 아이콘 → 아무 곳이나 누르면 시작
        setBoxOff(true)
        await run(l.before)
        if (!aliveRef.current) return
        setTapOn(l.tap)
        busyRef.current = false
        await new Promise((r) => (waitClickRef.current = r))
        busyRef.current = true
        setTapOn(null)
        await run(l.after)
        if (!aliveRef.current) return
        setBoxOff(false)
        await nextFrame()
        return play(nextOf(i))
      }
      await sleep(dialog.gap ?? 0.3)
      await run(l.before)
      if (!aliveRef.current) return
      setStep(i)
      setLabel(nameOf(l.who))
      await typeLine(l.text)
      await run(l.after)
      if (!aliveRef.current) return
      if (l.choices) return setChoices(l.choices) // 선택할 때까지 진행 멈춤
      if (l.auto) return play(nextOf(i))
      busyRef.current = false
      setReady(true)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, dialog.gap, run, typeLine],
  )

  // ── 시작: 배경 0.7초 페이드 인 → 장소 안내 ──
  useLayoutEffect(() => {
    aliveRef.current = true
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' })
    let cancelled = false
    ;(async () => {
      await sleep(0.7)
      if (cancelled) return
      setBox(true)
      await typeLine(dialog.place)
      busyRef.current = false
      setReady(true)
    })()
    return () => {
      cancelled = true
      aliveRef.current = false
      clearInterval(typingRef.current)
    }
  }, [dialog.place, typeLine])

  useEffect(() => {
    if (box) gsap.fromTo(boxRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
  }, [box])

  const close = useCallback(() => {
    aliveRef.current = false
    clearInterval(typingRef.current)
    gsap.to(rootRef.current, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => onClose(false, resumeRef.current) })
  }, [onClose])

  const next = useCallback(() => {
    if (waitClickRef.current) {
      const done = waitClickRef.current
      waitClickRef.current = null
      return done()
    }
    if (finishRef.current) return finishRef.current()
    if (busyRef.current) return
    if (step < 0) return play(startAt && labelIdx[startAt] != null ? labelIdx[startAt] : 0, true)
    const n = nextOf(step)
    if (n < lines.length) play(n)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, lines.length, play, startAt, labelIdx])

  const choose = (c) => {
    setChoices(null)
    play(labelIdx[c.goto])
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      else if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, close])

  const bgNow = bgSrcs[bgKey] || { src: BASE + dialog.bgs[bgKey].src }

  return createPortal(
    <div className={`dialog cast${dialog.calm ? ' is-calm' : ''}`} ref={rootRef} role="dialog" aria-modal="true" aria-label={dialog.place} onClick={next}>
      <div className="dialog__stage">
        {/* 카메라가 움직이는 세계: 배경 + 인물 */}
        <div className="cast__world" ref={worldRef}>
          <img className="cast__bg" src={bgNow.src} style={{ objectPosition: bgNow.pos || '' }} alt="" />
          <img className="cast__bg cast__bg-next" alt="" style={{ opacity: 0 }} />
          {/* 배경을 오가는 학생들 */}
          {walkers &&
            dialog.walkers?.map((w, i) => (
              <img
                key={i}
                className={`cast__walker${w.dir < 0 ? ' is-rev' : ''}`}
                src={BASE + w.src}
                alt=""
                style={{ '--b': w.bottom, '--h': w.h, animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s` }}
              />
            ))}
          {Object.entries(dialog.cast).map(([who, c]) => {
            const p = poses[who]
            const src = p ? srcs[`${who}/${p}`] || BASE + c.fallback : null
            const temp = src && src.includes('/placeholder/')
            // 말하는 인물은 살짝 커지고, 나머지 인물은 살짝 어두워짐
            const focus = focusWho ? ((c.as || who) === focusWho ? ' is-speaking' : ' is-dim') : ''
            return (
              <div
                key={who}
                ref={(el) => (charRefs.current[who] = el)}
                className={`cast__char cast__char--${who}`}
                style={{ '--x': c.x, '--b': c.bottom, '--w': c.w, visibility: p ? 'visible' : 'hidden' }}
              >
                <div className={`cast__char-inner${focus}`}>
                  {/* flip 목록에 있는 포즈는 좌우 반전 (같은 옆모습으로 양쪽 방향) */}
                  <div className={c.flip === true || c.flip?.includes(p) ? 'cast__flip' : undefined}>
                    {src && <PoseLayer src={src} dur={poseDur[who] ?? 0.3} />}
                  </div>
                </div>
                {temp && <span className="cast__temp">{c.name} (임시)</span>}
                {bubbles[who] && <span className="cast__say">{bubbles[who]}</span>}
                {tapOn === who && (
                  <span className="cast__tap" aria-label="말 걸기">
                    <svg viewBox="0 0 48 44" aria-hidden="true">
                      <path d="M6 4h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H22l-10 9v-9H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="#fff" stroke="#0225ff" strokeWidth="3" />
                      <circle cx="15" cy="18" r="3" fill="#0225ff" />
                      <circle cx="24" cy="18" r="3" fill="#0225ff" />
                      <circle cx="33" cy="18" r="3" fill="#0225ff" />
                    </svg>
                  </span>
                )}
              </div>
            )
          })}
          {/* 소품 */}
          {Object.entries(dialog.props || {}).map(([id, p]) =>
            propsOn[id] ? (
              <div
                key={id}
                ref={(el) => (propRefs.current[id] = el)}
                className={`cast__prop cast__prop--${id}`}
                style={{ '--x': p.x, '--b': p.bottom, '--w': p.w }}
              >
                {p.src ? <img src={BASE + p.src} alt="" /> : <PropIcon kind={p.kind} />}
              </div>
            ) : null,
          )}
          {/* 앞을 지나가는 학생들 */}
          {passers > 0 &&
            dialog.passersImgs?.map((src, i) => (
              <img key={`${passers}-${i}`} className={`cast__passer${i % 2 ? ' is-rev' : ''}`} src={BASE + src} alt="" style={{ animationDelay: `${i * 0.45}s` }} />
            ))}
        </div>

        {/* 참치김밥 봉투 */}
        {bagOn && (
          <div className="cast__bag" ref={bagRef}>
            {bagSrc ? <img className="cast__bag-img" src={bagSrc} alt="참치김밥" /> : <KimbapBag />}
          </div>
        )}

        {/* 조별 과제 사진 */}
        {photoOpen && (
          <div className={`cast__photo${photoOpen === 'left' ? ' is-left' : ''}`} ref={photoRef}>
            <div className="cast__photo-inner">
              <img src={photoSrc} alt="조별 과제 사진" />
            </div>
          </div>
        )}

        {/* 메신저 */}
        {msgs && (
          <div className="cast__msg">
            <p className="cast__msg-head">MESSAGE</p>
            {msgs.map((m, i) => (
              <p key={i} className={`cast__bubble cast__bubble--${m.from}`}>
                {m.text}
              </p>
            ))}
          </div>
        )}

        {/* NEW CHARACTER 카드 */}
        {profile && (
          <div className="cast__profile">
            <span className="cast__profile-tag">NEW CHARACTER</span>
            <span className="cast__profile-name">{profile.name}</span>
          </div>
        )}

        <div className="cast__dark" />

        {/* 장소 안내 동안 검은 화면 → 첫 대사에서 걷힘 */}
        <div className="dialog__curtain" ref={curtainRef} />

        {/* 선택지 */}
        {choices && (
          <div className={`cast__choices${choices.some((c) => c.img) ? ' is-cards' : ''}`} onClick={(e) => e.stopPropagation()}>
            {choices.map((c) =>
              c.img ? (
                // 그림 카드 선택지 (메뉴 고르기 등)
                <button key={c.text} type="button" className="cast__card" onClick={() => choose(c)}>
                  <img src={BASE + c.img} alt="" />
                  <span className="cast__card-name">{c.text}</span>
                  {c.sub && <span className="cast__card-sub">{c.sub}</span>}
                </button>
              ) : (
                <button key={c.text} type="button" className="cast__choice" onClick={() => choose(c)}>
                  {c.text}
                </button>
              ),
            )}
          </div>
        )}

        {game && (
          <FlyerGame
            bg={BASE + dialog.game.bg}
            hannam={BASE + dialog.game.host}
            npcs={dialog.game.npcs.map((n) => BASE + n)}
            flyer={dialog.game.flyer && BASE + dialog.game.flyer}
            onDone={(res) => gameResRef.current?.(res)}
          />
        )}

        {reward && <RewardPop src={BASE + reward.src} label={reward.label} />}

        {itemGet && <ItemGet {...itemGet} onOk={() => itemResRef.current?.()} />}

        {box && !boxOff && (
          <div ref={boxRef} className={`dialog__box${line.who ? ' has-name' : ''}${line.place ? ' is-place' : ''}${flip ? ' is-flip' : ''}${bagOn ? ' has-bag' : ''}`}>
            {line.who && (
              <span className="dialog__name" ref={nameRef}>
                {label}
              </span>
            )}
            <p className="dialog__text" aria-live="polite">
              {full.slice(0, typed)}
              <span className="dialog__ghost" aria-hidden="true">
                {full.slice(typed)}
              </span>
            </p>
            {ready && <img className="dialog__next" src={`${BASE}talk/arrow.png`} alt="" />}
          </div>
        )}

        {complete && <QuestComplete {...complete} />}
      </div>

      <button
        type="button"
        className="dialog__close"
        onClick={(e) => {
          e.stopPropagation()
          close()
        }}
        aria-label="대화 닫기"
      >
        ✕
      </button>
    </div>,
    document.body,
  )
}

function PoseLayer({ src, dur }) {
  const [base, setBase] = useState(src)
  const topRef = useRef(null)
  const top = src !== base ? src : null
  useLayoutEffect(() => {
    if (!top || !topRef.current) return
    const t = gsap.fromTo(topRef.current, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'power1.out', onComplete: () => setBase(top) })
    return () => t.kill()
  }, [top, dur])
  return (
    <>
      <img className="dialog__pose" src={base} alt="" />
      {top && <img key={top} ref={topRef} className="dialog__pose" src={top} alt="" style={{ opacity: 0 }} />}
    </>
  )
}

// 참치김밥 봉투 (이미지가 없을 때 쓰는 그림)
function KimbapBag() {
  return (
    <svg viewBox="0 0 200 220" aria-label="참치김밥 봉투">
      <path d="M62 60 Q62 18 100 18 Q138 18 138 60" fill="none" stroke="#e8e8ee" strokeWidth="12" strokeLinecap="round" />
      <path d="M30 60 H170 L160 210 H40 Z" fill="#fbfbff" stroke="#c9cbe0" strokeWidth="4" strokeLinejoin="round" />
      <rect x="54" y="104" width="92" height="56" rx="10" fill="#0225ff" />
      <text x="100" y="128" textAnchor="middle" fontFamily="Galmuri9, sans-serif" fontSize="17" fill="#fff">참치</text>
      <text x="100" y="150" textAnchor="middle" fontFamily="Galmuri9, sans-serif" fontSize="17" fill="#fff">김밥</text>
    </svg>
  )
}

function QuestComplete({ title, sub, foot }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const q = gsap.utils.selector(ref)
    gsap
      .timeline()
      .fromTo(q('.cast__qc-title'), { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2.2)' })
      .fromTo(q('.cast__qc-sub'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.35)
      .fromTo(q('.cast__qc-foot, .cast__qc-hint'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.7)
  }, [])
  return (
    <div className="cast__qc" ref={ref}>
      <p className="cast__qc-title">{title}</p>
      <p className="cast__qc-sub">{sub}</p>
      <p className="cast__qc-foot">{foot}</p>
      <p className="cast__qc-hint">눌러서 지도로</p>
    </div>
  )
}

// 소품 그림 (이미지가 없을 때)
function PropIcon({ kind }) {
  if (kind === 'flyers')
    return (
      <svg viewBox="0 0 120 110" aria-label="홍보물 더미">
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${10 + i * 4} ${42 - i * 12}) rotate(${-6 + i * 4} 40 30)`}>
            <rect width="80" height="58" rx="3" fill="#fff" stroke="#0225ff" strokeWidth="3" />
            <rect x="8" y="8" width="40" height="12" fill="#0225ff" />
            <rect x="8" y="27" width="60" height="5" fill="#5f8cf7" />
            <rect x="8" y="38" width="44" height="5" fill="#5f8cf7" />
          </g>
        ))}
      </svg>
    )
  return (
    <svg viewBox="0 0 100 100" aria-label="가방">
      <path d="M32 34v-8a18 18 0 0 1 36 0v8" fill="none" stroke="#0225ff" strokeWidth="7" strokeLinecap="round" />
      <rect x="12" y="32" width="76" height="58" rx="12" fill="#5f8cf7" stroke="#0225ff" strokeWidth="5" />
      <rect x="40" y="50" width="20" height="12" rx="3" fill="#fff" />
    </svg>
  )
}

// 아이템 획득 화면: 어두워짐 → 그림이 아래에서 올라옴 → 글자 차례로
// → 평소와 같은 대화창에 독백 (화면 아무 곳이나 눌러 넘김) → 0.5초 뒤 보관 안내 + 확인
function ItemGet({ img, title, sub, desc, monologue = [], saved, onOk }) {
  const ref = useRef(null)
  const [n, setN] = useState(-1) // 보이는 독백 줄 (-1 = 아직)
  const [typed, setTyped] = useState(0)
  const [ready, setReady] = useState(false) // 다음으로 넘길 수 있음 (화살표)
  const [done, setDone] = useState(false)
  const timers = useRef([])
  const finishRef = useRef(null)
  const later = (fn, sec) => timers.current.push(setTimeout(fn, sec * 1000))

  // 한 줄 타이핑 (누르면 한 번에 다 보임)
  const say = useCallback(
    (i) => {
      setN(i)
      setTyped(0)
      setReady(false)
      const text = monologue[i].text
      let k = 0
      const end = () => {
        clearInterval(t)
        finishRef.current = null
        setTyped(text.length)
        if (i === monologue.length - 1) later(() => setDone(true), 0.5)
        else setReady(true)
      }
      const t = setInterval(() => {
        k += 1
        setTyped(k)
        if (k >= text.length) end()
      }, 35)
      finishRef.current = end
      timers.current.push(t)
    },
    [monologue],
  )

  useLayoutEffect(() => {
    const q = gsap.utils.selector(ref)
    const tl = gsap
      .timeline()
      .fromTo(ref.current, { backgroundColor: 'rgba(0,0,20,0)' }, { backgroundColor: 'rgba(0,0,20,0.72)', duration: 0.2 })
      .fromTo(q('.cast__get-img'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' })
      .fromTo(q('.cast__get-title'), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.2)' })
      .fromTo(q('.cast__get-sub'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 })
      .fromTo(q('.cast__get-desc'), { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .call(() => (monologue.length ? say(0) : setDone(true)), [], '+=0.6')
    playSfx('complete')
    const list = timers.current
    return () => {
      tl.kill()
      list.forEach((t) => (clearTimeout(t), clearInterval(t)))
    }
  }, [monologue, say])

  // 화면을 누르면: 타이핑 중이면 한 번에, 다 나왔으면 다음 줄 (대사 사이 정적 후)
  const next = (e) => {
    e.stopPropagation()
    if (finishRef.current) return finishRef.current()
    if (!ready) return
    setReady(false)
    later(() => say(n + 1), monologue[n + 1].pause ?? 0.2)
  }

  const line = n >= 0 ? monologue[n] : null
  return (
    <div className={`cast__get${line ? ' has-talk' : ''}`} ref={ref} onClick={next}>
      <img className="cast__get-img" src={BASE + img} alt="" />
      <p className="cast__get-title">{title}</p>
      <p className="cast__get-sub">{sub}</p>
      <p className="cast__get-desc">{desc}</p>
      {done && (
        <>
          <p className="cast__get-saved">{saved}</p>
          <button
            type="button"
            className="cast__get-ok"
            onClick={(e) => {
              e.stopPropagation()
              onOk()
            }}
          >
            확인
          </button>
        </>
      )}

      {/* 독백: 평소 대화창과 같은 모양 */}
      {line && (
        <div className="dialog__box has-name is-flip">
          <span className="dialog__name">나</span>
          <p className="dialog__text" aria-live="polite">
            {line.text.slice(0, typed)}
            <span className="dialog__ghost" aria-hidden="true">
              {line.text.slice(typed)}
            </span>
          </p>
          {ready && <img className="dialog__next" src={`${BASE}talk/arrow.png`} alt="" />}
        </div>
      )}
    </div>
  )
}
