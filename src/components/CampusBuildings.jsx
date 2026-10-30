import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'
import {
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  MeshBasicMaterial,
  Shape,
} from 'three'
import { BUILDINGS } from '../data/buildings.js'

// 외곽선 스타일 (Figma 위치 표시 이미지의 파란 선 색)
const OUTLINE_COLOR = '#0225ff'
const OUTLINE_STRENGTH = 30 // 선 진하기
const DRAG_THRESHOLD = 6 // px: 이보다 많이 움직였으면 클릭이 아니라 드래그로 봄

// 보이지 않지만 마우스·터치는 감지하는 재질
const INVISIBLE = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })

function pointInPolygon(x, z, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

// 캠퍼스 모델에서 각 건물 영역의 삼각형만 골라 외곽선용 지오메트리를 만듭니다.
// 원본 모델은 건드리지 않고, 정점 데이터를 공유하는 "부분 복사본"만 만듭니다.
function extractBuildingGeometries(mesh) {
  const pos = mesh.geometry.attributes.position
  const tri = mesh.geometry.index.array
  mesh.updateWorldMatrix(true, false)
  const e = mesh.matrixWorld.elements

  // 정점의 월드 좌표 (footprint 좌표계와 맞추기 위해)
  const n = pos.count
  const wx = new Float32Array(n)
  const wy = new Float32Array(n)
  const wz = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    wx[i] = e[0] * x + e[4] * y + e[8] * z + e[12]
    wy[i] = e[1] * x + e[5] * y + e[9] * z + e[13]
    wz[i] = e[2] * x + e[6] * y + e[10] * z + e[14]
  }

  const boxes = BUILDINGS.map((b) => {
    const xs = b.footprint.map((p) => p[0])
    const zs = b.footprint.map((p) => p[1])
    return {
      x0: Math.min(...xs), x1: Math.max(...xs),
      z0: Math.min(...zs), z1: Math.max(...zs),
      y0: b.yMin - 0.003, y1: b.yMax + 0.01,
    }
  })
  const lists = BUILDINGS.map(() => [])

  for (let t = 0; t < tri.length; t += 3) {
    const a = tri[t], b = tri[t + 1], c = tri[t + 2]
    const cx = (wx[a] + wx[b] + wx[c]) / 3
    const cy = (wy[a] + wy[b] + wy[c]) / 3
    const cz = (wz[a] + wz[b] + wz[c]) / 3
    for (let k = 0; k < boxes.length; k++) {
      const bb = boxes[k]
      if (cx < bb.x0 || cx > bb.x1 || cz < bb.z0 || cz > bb.z1 || cy < bb.y0 || cy > bb.y1) continue
      if (pointInPolygon(cx, cz, BUILDINGS[k].footprint)) lists[k].push(a, b, c)
    }
  }

  return lists.map((list) => {
    const g = new BufferGeometry()
    g.setAttribute('position', pos)
    g.setIndex(new BufferAttribute(new Uint32Array(list), 1))
    return g
  })
}

// 클릭 판정용 보이지 않는 기둥 (바닥 윤곽을 높이만큼 세운 모양)
function makePickGeometry(b) {
  const shape = new Shape(b.footprint.map(([x, z]) => ({ x, y: z })))
  const depth = b.yMax - b.yMin + 0.01
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  g.rotateX(Math.PI / 2) // 모양을 바닥(XZ)에 눕히고 아래로 세움
  g.translate(0, b.yMax + 0.01, 0)
  return g
}

export default function CampusBuildings({ mesh, dragging, onSelect, onPointingChange }) {
  const invalidate = useThree((s) => s.invalidate)
  const [hovered, setHovered] = useState(null) // 마우스를 올린 건물
  const [armed, setArmed] = useState(null) // 터치: 한 번 탭해서 강조된 건물
  const [selected, setSelected] = useState(null)

  const geometries = useMemo(() => extractBuildingGeometries(mesh), [mesh])
  const pickGeometries = useMemo(() => BUILDINGS.map(makePickGeometry), [])
  const [outlineMeshes, setOutlineMeshes] = useState([])

  // 드래그 중에는 강조를 바꾸지 않음
  const active = dragging ? selected : (hovered ?? armed ?? selected)
  const activeIndex = BUILDINGS.findIndex((b) => b.id === active)

  useEffect(() => {
    onPointingChange?.(!dragging && hovered !== null)
    invalidate()
  }, [hovered, dragging, active, onPointingChange, invalidate])

  const handleClick = (b) => (e) => {
    if (e.delta > DRAG_THRESHOLD) return // 드래그 후 손을 뗀 경우
    e.stopPropagation()
    // 터치: 첫 탭은 강조만, 같은 건물을 한 번 더 탭하면 선택
    if (e.pointerType !== 'mouse' && armed !== b.id) {
      setArmed(b.id)
      return
    }
    setArmed(null)
    setSelected(b.id)
    onSelect?.(b)
  }

  return (
    <>
      {BUILDINGS.map((b, i) => (
        <group key={b.id}>
          {/* 외곽선을 그릴 건물 부분 (화면에는 보이지 않음) */}
          <mesh
            ref={(m) => {
              if (m && outlineMeshes[i] !== m) {
                setOutlineMeshes((prev) => {
                  const next = [...prev]
                  next[i] = m
                  return next
                })
              }
            }}
            geometry={geometries[i]}
            material={INVISIBLE}
            matrixAutoUpdate={false}
            matrix={mesh.matrixWorld}
            visible={i === activeIndex}
            raycast={() => null}
          />
          {/* 클릭 판정용 기둥 */}
          <mesh
            geometry={pickGeometries[i]}
            material={INVISIBLE}
            onPointerOver={(e) => {
              if (e.pointerType !== 'mouse') return
              e.stopPropagation()
              setHovered(b.id)
            }}
            onPointerOut={() => setHovered((h) => (h === b.id ? null : h))}
            onClick={handleClick(b)}
            onPointerMissed={() => setArmed((a) => (a === b.id ? null : a))}
          />
        </group>
      ))}

      <EffectComposer multisampling={4} autoClear={false}>
        <Outline
          selection={activeIndex >= 0 && outlineMeshes[activeIndex] ? [outlineMeshes[activeIndex]] : []}
          visibleEdgeColor={OUTLINE_COLOR}
          hiddenEdgeColor={OUTLINE_COLOR}
          edgeStrength={OUTLINE_STRENGTH}
          pulseSpeed={0}
          // 외곽선용 복사본은 원본 모델과 같은 자리에 겹쳐 있어서
          // 가려짐 판정을 끄고(xRay) 윤곽 전체를 그립니다
          xRay
          blur
          kernelSize={KernelSize.VERY_SMALL} // 선 굵기
        />
      </EffectComposer>
    </>
  )
}
