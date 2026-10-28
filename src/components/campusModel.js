import { useGLTF } from '@react-three/drei'

// 기기에 맞는 캠퍼스 모델 파일을 고릅니다.
// - 데스크톱: 원본 (텍스처 4096px, 19.7MB)
// - 모바일/작은 화면: 최적화본 (텍스처 2048px WebP, 12.6MB, GPU 메모리 약 1/3)
// 두 파일 모두 형태(지오메트리)는 같습니다.
const ORIGINAL = '/models/Campus_3D_Area.glb'
const MOBILE = '/models/Campus_3D_Area.mobile.glb'

function isLightDevice() {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.max(window.screen.width, window.screen.height) < 1024
  return coarse || small
}

export const CAMPUS_MODEL_URL = isLightDevice() ? MOBILE : ORIGINAL

// 시작 페이지에서 미리 호출해 모델을 백그라운드로 받아둡니다.
export function preloadCampus() {
  useGLTF.preload(CAMPUS_MODEL_URL)
}
