import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import {
  Color,
  LinearMipmapLinearFilter,
  MeshBasicMaterial,
  MathUtils,
  MOUSE,
  NearestFilter,
  NoColorSpace,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TOUCH,
} from 'three'
import { BUILDINGS } from '../data/buildings.js'
import { readMapAssets } from './mapAssets.js'
import './MapMarkers.css'

const deg = MathUtils.degToRad

// ── 2.5D 지도 설정 ──────────────────────────────
const MAP = {
  fov: 30,
  cameraDistance: 3600, // 그림 픽셀 단위
  depthRange: 850, // 깊이 지도 흰색~검은색의 실제 거리 (클수록 입체감 ↑, 늘어짐 ↑)
  segments: [360, 171], // 그림을 나눈 격자 수 (클수록 높낮이가 촘촘)
  azimuthRange: deg(16), // 좌우 회전 ±16°
  // 상하 회전: 방향마다 다르게 (사진 한 장이라 위에서 내려다보는 쪽으로 많이 돌리면 건물이 뭉개짐)
  polarDown: deg(5), // 낮게 눕혀 보는 쪽 (자연스러움)
  polarUp: deg(3), // 위에서 내려다보는 쪽
  fill: 0.88, // 처음 화면에서 그림이 차지하는 비율
}
const OUTLINE_COLOR = '#0225ff'
const MARKER_IMG = `${import.meta.env.BASE_URL}images/marker_outline.png`
const MARKER_LIFT = 40 // 마커를 땅보다 카메라 쪽으로 띄우는 거리 (회전할 때 떠 있는 느낌)
const MARKER_DEPTH = 0.3 // 핀 끝이 가리키는 지점: 구역 위쪽 끝(0) ~ 아래쪽 끝(1) 사이
const OUTLINE_RADIUS = 3 // 외곽선 두께 (건물 위치 지도 픽셀 단위, 1칸 = 그림 2px)
const DRAG_THRESHOLD = 6

// 보이지 않지만 마우스·터치는 감지하는 재질
const INVISIBLE = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })

// 가로 화면에서는 Figma처럼 지도를 화면 약간 아래쪽에 배치 (0.5 = 정중앙)
const verticalCenter = (aspect) => (aspect >= 1.2 ? 0.58 : 0.5)

function sampleDepth(depth, u, v) {
  // 이중선형 보간으로 부드럽게 읽기 (u, v: 0~1, v=0 이 그림 위쪽)
  const { width: w, height: h, data } = depth
  const x = Math.min(w - 1.001, Math.max(0, u * (w - 1)))
  const y = Math.min(h - 1.001, Math.max(0, v * (h - 1)))
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const at = (xx, yy) => data[(yy * w + xx) * 4] / 255
  const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx
  const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx
  return top * (1 - fy) + bottom * fy
}

// 그림 크기의 판을 만들고, 각 점을 카메라 쪽으로 깊이만큼 당깁니다.
// 카메라에서 나가는 시선 방향으로만 움직이므로 처음 화면은 원본 그림과 똑같이 보입니다.
function makeReliefGeometry(width, height, depth, [sx, sy]) {
  const g = new PlaneGeometry(width, height, sx, sy)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  const D = MAP.cameraDistance

  let mean = 0
  const n = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    n[i] = sampleDepth(depth, uv.getX(i), 1 - uv.getY(i))
    mean += n[i]
  }
  mean /= pos.count

  for (let i = 0; i < pos.count; i++) {
    const z = (n[i] - mean) * MAP.depthRange
    const t = z / D
    pos.setXYZ(i, pos.getX(i) * (1 - t), pos.getY(i) * (1 - t), z)
  }
  g.computeBoundingSphere()
  g.userData.mean = mean
  return g
}

// 마우스를 올렸을 때 마커 위에 뜨는 이름표 문구
const labelText = (b) => (b.number ? `${b.name} (${b.number}번)` : b.name)

// 그림 좌표(px) → 3D 위치 (판을 만들 때와 같은 방식)
function imageToWorld(px, py, width, height, depth, mean, lift = 0) {
  const n = sampleDepth(depth, px / width, py / height)
  const z = (n - mean) * MAP.depthRange + lift
  const t = z / MAP.cameraDistance
  return [(px - width / 2) * (1 - t), (height / 2 - py) * (1 - t), z]
}

// 건물 위치 지도에서 각 장소에 핀을 꽂을 좌표를 찾습니다 (그림 px)
function findMarkerAnchors(ids, width, height) {
  const { width: w, height: h, data } = ids
  const sx = width / w
  const sy = height / h
  return BUILDINGS.map((_, i) => {
    const id = i + 1
    let sumX = 0
    let count = 0
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4] === id) {
          sumX += x
          count++
        }
      }
    }
    if (!count) return null
    const cx = Math.round(sumX / count)
    // 가운데 열 근처(±3칸)에서 구역의 위·아래 끝을 찾고, 위에서 MARKER_DEPTH 만큼 내려온 지점
    let top = h
    let bottom = 0
    for (let x = Math.max(0, cx - 3); x <= Math.min(w - 1, cx + 3); x++) {
      for (let y = 0; y < h; y++) {
        if (data[(y * w + x) * 4] === id) {
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
        }
      }
    }
    const y = top + (bottom - top) * MARKER_DEPTH
    return { px: (cx + 0.5) * sx, py: (y + 0.5) * sy }
  })
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// 그림을 그대로 그리고, 선택된 건물 영역 바깥 테두리에만 외곽선 색을 칠합니다.
const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D idMap;
  uniform vec2 idTexel;
  uniform float activeId;
  uniform float radius;
  uniform vec3 outlineColor;
  varying vec2 vUv;

  float idAt(vec2 uv) {
    return floor(texture2D(idMap, uv).r * 255.0 + 0.5);
  }

  void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < 0.5) discard;

    if (activeId > 0.5 && idAt(vUv) != activeId) {
      float near = 0.0;
      for (int i = 0; i < 16; i++) {
        float a = float(i) * 0.3926991; // 2π / 16
        vec2 dir = vec2(cos(a), sin(a)) * idTexel;
        near = max(near, idAt(vUv + dir * radius) == activeId ? 1.0 : 0.0);
        near = max(near, idAt(vUv + dir * radius * 0.5) == activeId ? 1.0 : 0.0);
      }
      if (near > 0.5) color.rgb = outlineColor;
    }

    gl_FragColor = vec4(color.rgb, 1.0);
    #include <colorspace_fragment>
  }
`

export default function MapScene({ onReady, onDragChange, dragging, onSelectBuilding, onPointingChange }) {
  const assets = readMapAssets()
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const controlsRef = useRef(null)

  const width = assets.image.naturalWidth
  const height = assets.image.naturalHeight

  const geometry = useMemo(
    () => makeReliefGeometry(width, height, assets.depth, MAP.segments),
    [assets, width, height],
  )
  // 클릭 판정용 (같은 모양, 더 성긴 격자 → 빠름)
  const pickGeometry = useMemo(
    () => makeReliefGeometry(width, height, assets.depth, [90, 43]),
    [assets, width, height],
  )

  const markers = useMemo(() => {
    const mean = geometry.userData.mean
    return findMarkerAnchors(assets.ids, width, height).map((a) =>
      a ? imageToWorld(a.px, a.py, width, height, assets.depth, mean, MARKER_LIFT) : null,
    )
  }, [assets, width, height, geometry])

  const material = useMemo(() => {
    const map = new Texture(assets.image)
    map.colorSpace = SRGBColorSpace
    map.minFilter = LinearMipmapLinearFilter
    map.anisotropy = gl.capabilities.getMaxAnisotropy()
    map.needsUpdate = true

    const idMap = new Texture(assets.ids)
    idMap.colorSpace = NoColorSpace
    idMap.minFilter = NearestFilter
    idMap.magFilter = NearestFilter
    idMap.generateMipmaps = false
    idMap.needsUpdate = true

    return new ShaderMaterial({
      uniforms: {
        map: { value: map },
        idMap: { value: idMap },
        idTexel: { value: [1 / assets.ids.width, 1 / assets.ids.height] },
        activeId: { value: 0 },
        radius: { value: OUTLINE_RADIUS },
        outlineColor: { value: new Color(OUTLINE_COLOR) },
      },
      vertexShader,
      fragmentShader,
    })
  }, [assets, gl])

  // ── 화면 크기에 맞춰 카메라 배치 ──
  useLayoutEffect(() => {
    const aspect = size.width / size.height
    const c = verticalCenter(aspect)
    const D = MAP.cameraDistance
    const halfH = D * Math.tan(deg(MAP.fov) / 2) // zoom 1 일 때 판 위치에서 보이는 높이의 절반
    // 회전했을 때도 잘리지 않도록 약간 여유를 둠
    const margin = 1.06
    const roomV = Math.min(c, 1 - c) * 2 * 0.96 // 세로로 쓸 수 있는 비율
    const zoomW = (2 * halfH * aspect * MAP.fill) / (width * margin)
    const zoomH = (2 * halfH * roomV) / (height * margin)

    camera.fov = MAP.fov
    camera.near = D / 20
    camera.far = D * 4
    camera.zoom = Math.min(zoomW, zoomH)
    camera.position.set(0, 0, D)
    camera.lookAt(0, 0, 0)
    const shift = (c - 0.5) * size.height
    camera.setViewOffset(size.width, size.height, 0, -shift, size.width, size.height)
    camera.updateProjectionMatrix()

    const controls = controlsRef.current
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    }
    invalidate()
  }, [camera, size, width, height, invalidate])

  // ── 건물 hover / 클릭 ──
  const [hovered, setHovered] = useState(0) // 건물 번호 (0 = 없음)
  const [armed, setArmed] = useState(0) // 터치: 첫 탭으로 강조된 건물
  const [selected, setSelected] = useState(0)
  const active = dragging ? selected : hovered || armed || selected

  useEffect(() => {
    material.uniforms.activeId.value = active
    onPointingChange?.(!dragging && hovered > 0)
    invalidate()
  }, [active, hovered, dragging, material, onPointingChange, invalidate])

  const idAtUv = (uv) => {
    if (!uv) return 0
    const { width: w, height: h, data } = assets.ids
    const x = Math.min(w - 1, Math.max(0, Math.floor(uv.x * w)))
    const y = Math.min(h - 1, Math.max(0, Math.floor((1 - uv.y) * h)))
    return data[(y * w + x) * 4]
  }

  const handleClick = (e) => {
    if (e.delta > DRAG_THRESHOLD) return
    const id = idAtUv(e.uv)
    if (!id) {
      setArmed(0)
      return
    }
    e.stopPropagation()
    if (e.pointerType !== 'mouse' && armed !== id) {
      setArmed(id)
      return
    }
    setArmed(0)
    setSelected(id)
    onSelectBuilding?.(BUILDINGS[id - 1])
  }

  useEffect(() => {
    onReady?.()
  }, [onReady])

  return (
    <>
      <mesh geometry={geometry} material={material} raycast={() => null} />
      <mesh
        geometry={pickGeometry}
        material={INVISIBLE}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return
          setHovered(idAtUv(e.uv))
        }}
        onPointerLeave={() => setHovered(0)}
        onClick={handleClick}
      />
      {/* 장소 마커: 각 구역 위에 떠 있고, 누르면 그 장소를 선택 */}
      {markers.map((position, i) =>
        position ? (
          <Html key={BUILDINGS[i].id} position={position} zIndexRange={[5, 0]}>
            <button
              type="button"
              className={`map-marker${active === i + 1 ? ' is-active' : ''}${
                hovered === i + 1 || armed === i + 1 ? ' is-hovered' : ''
              }`}
              style={{ '--bob-delay': `${i * -0.45}s` }}
              aria-label={`${BUILDINGS[i].name} (${BUILDINGS[i].characters.join(', ')})`}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(i + 1)}
              onPointerLeave={() => setHovered(0)}
              onFocus={() => setHovered(i + 1)}
              onBlur={() => setHovered(0)}
              onClick={() => {
                setArmed(0)
                setSelected(i + 1)
                onSelectBuilding?.(BUILDINGS[i])
              }}
            >
              {/* 이름표와 핀이 함께 둥실거림 */}
              <span className="map-marker__float">
                <span className="map-marker__label" aria-hidden="true">
                  {labelText(BUILDINGS[i])}
                </span>
                <img className="map-marker__pin" src={MARKER_IMG} alt="" draggable="false" />
              </span>
            </button>
          </Html>
        ) : null,
      )}

      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        enableRotate
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.45}
        autoRotate={false}
        minAzimuthAngle={-MAP.azimuthRange}
        maxAzimuthAngle={MAP.azimuthRange}
        minPolarAngle={Math.PI / 2 - MAP.polarUp}
        maxPolarAngle={Math.PI / 2 + MAP.polarDown}
        mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: null, RIGHT: null }}
        touches={{ ONE: TOUCH.ROTATE, TWO: null }}
        onStart={() => onDragChange?.(true)}
        onEnd={() => onDragChange?.(false)}
      />
    </>
  )
}
