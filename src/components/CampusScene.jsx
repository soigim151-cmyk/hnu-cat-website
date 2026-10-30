import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, MathUtils, MOUSE, TOUCH, Vector3 } from 'three'
import CampusBuildings from './CampusBuildings.jsx'

const deg = MathUtils.degToRad

// ── 카메라 구도 설정 ──────────────────────────────
// 모델 좌표축: Y가 위쪽, 캠퍼스의 긴 방향이 X축 (약 1.9), 짧은 방향이 Z축 (약 1.0)
const VIEW = {
  azimuth: deg(0), // 좌우 방향: +Z 쪽(정문 쪽)에서 바라봄
  polar: deg(45), // 상하 방향: 수직에서 45° 기울여 비스듬히 내려다봄
  fov: 28, // 시야각을 좁게 → 원근 왜곡이 적은 구도
  azimuthRange: deg(20), // 좌우 회전 ±20°
  polarRange: deg(10), // 상하 회전 ±10°
  initialFill: 0.87, // 처음 화면에서 캠퍼스가 차지하는 가로 비율 (Figma 시안 기준)
  safeFill: 0.96, // 회전 범위 끝에서도 이 비율 안에 들어오도록 (잘림 방지)
}

// 가로 화면에서는 Figma처럼 캠퍼스를 화면 약간 아래쪽에 배치 (0.5 = 정중앙)
const verticalCenter = (aspect) => (aspect >= 1.2 ? 0.6 : 0.5)

// 모델의 정점 일부를 뽑아 둡니다 (화면 맞춤 계산용).
function samplePoints(scene, center, maxPoints = 30000) {
  const pts = []
  const v = new Vector3()
  scene.traverse((o) => {
    if (!o.isMesh) return
    const pos = o.geometry.attributes.position
    const step = Math.max(1, Math.floor(pos.count / maxPoints))
    for (let i = 0; i < pos.count; i += step) {
      pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).sub(center).clone())
    }
  })
  return pts
}

// 주어진 각도에서 모든 점이 화면 안(fill 비율)에 들어오는 최소 카메라 거리
function fitDistance(pts, azimuth, polar, fovDeg, aspect, ndcY0, fill) {
  const z = new Vector3().setFromSphericalCoords(1, polar, azimuth) // 카메라가 있는 방향
  const x = new Vector3(0, 1, 0).cross(z).normalize()
  const y = new Vector3().crossVectors(z, x)
  const tanV = Math.tan(deg(fovDeg) / 2)
  const tanH = tanV * aspect
  const topRoom = fill - ndcY0
  const bottomRoom = fill + ndcY0
  let d = 0
  for (const p of pts) {
    const px = p.dot(x)
    const py = p.dot(y)
    const pz = p.dot(z)
    d = Math.max(d, pz + Math.abs(px) / (tanH * fill))
    d = Math.max(d, py > 0 ? pz + py / (tanV * topRoom) : pz - py / (tanV * bottomRoom))
  }
  return d
}

export default function CampusScene({ url, onReady, onDragChange, dragging, onSelectBuilding, onPointingChange }) {
  const { scene } = useGLTF(url)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const controlsRef = useRef(null)

  // 캠퍼스 모델의 메시 (건물 외곽선 계산에 사용)
  const campusMesh = useMemo(() => {
    let found = null
    scene.traverse((o) => {
      if (o.isMesh && !found) found = o
    })
    return found
  }, [scene])

  // 1) 모델의 Bounding Box 중심 = 회전 중심
  const { center, points } = useMemo(() => {
    scene.updateMatrixWorld(true)
    const box = new Box3().setFromObject(scene)
    const c = box.getCenter(new Vector3())
    return { center: c, points: samplePoints(scene, c) }
  }, [scene])

  // 2) 화면 크기에 맞춰 카메라 거리·위치 계산
  useLayoutEffect(() => {
    const aspect = size.width / size.height
    const c = verticalCenter(aspect)
    const ndcY0 = 1 - 2 * c

    // 처음 구도 + 회전 범위의 끝 각도들에서 모두 잘리지 않는 거리
    let dist = fitDistance(points, VIEW.azimuth, VIEW.polar, VIEW.fov, aspect, ndcY0, VIEW.initialFill)
    for (const a of [-1, 0, 1]) {
      for (const p of [-1, 0, 1]) {
        const az = VIEW.azimuth + a * VIEW.azimuthRange
        const po = VIEW.polar + p * VIEW.polarRange
        dist = Math.max(dist, fitDistance(points, az, po, VIEW.fov, aspect, ndcY0, VIEW.safeFill))
      }
    }

    camera.fov = VIEW.fov
    camera.near = dist / 50
    camera.far = dist * 10
    camera.position
      .setFromSphericalCoords(dist, VIEW.polar, VIEW.azimuth)
      .add(center)
    camera.lookAt(center)

    // 회전 중심은 그대로 두고, 화면에 보이는 위치만 아래로 이동
    const shift = (c - 0.5) * size.height
    camera.setViewOffset(size.width, size.height, 0, -shift, size.width, size.height)
    camera.updateProjectionMatrix()

    const controls = controlsRef.current
    if (controls) {
      controls.target.copy(center)
      controls.update()
    }
    invalidate()
  }, [camera, center, points, size, invalidate])

  // 3) 모델이 준비되면 부모에게 알림 (등장 애니메이션 시작)
  useEffect(() => {
    onReady?.()
  }, [onReady])

  // 원본 형태 유지: 그림자·재질 변경 없이 그대로 사용
  return (
    <>
      {/* 드론 촬영 텍스처에는 그림자가 이미 담겨 있으므로
          고른 환경광 위주 + 약한 직사광으로 원본 색을 살립니다 */}
      <ambientLight intensity={2.6} />
      <directionalLight position={[2, 4, 3]} intensity={0.8} />
      {/* 외곽선 효과를 쓰면 캔버스가 불투명해지므로 배경색을 직접 지정 (페이지 배경과 동일) */}
      <color attach="background" args={['#f1edea']} />
      <primitive object={scene} />

      {/* 클릭 가능한 건물 + 외곽선 */}
      <CampusBuildings
        mesh={campusMesh}
        dragging={dragging}
        onSelect={onSelectBuilding}
        onPointingChange={onPointingChange}
      />

      <OrbitControls
        ref={controlsRef}
        target={center}
        enableRotate
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.45}
        autoRotate={false}
        // 초기 각도 기준 ±20° / ±10° 로 제한
        minAzimuthAngle={VIEW.azimuth - VIEW.azimuthRange}
        maxAzimuthAngle={VIEW.azimuth + VIEW.azimuthRange}
        minPolarAngle={VIEW.polar - VIEW.polarRange}
        maxPolarAngle={VIEW.polar + VIEW.polarRange}
        // 왼쪽 버튼 드래그만 회전, 휠·오른쪽 버튼은 사용 안 함
        mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: null, RIGHT: null }}
        // 손가락 하나로 회전, 두 손가락(핀치)은 사용 안 함
        touches={{ ONE: TOUCH.ROTATE, TWO: null }}
        onStart={() => onDragChange?.(true)}
        onEnd={() => onDragChange?.(false)}
      />
    </>
  )
}
