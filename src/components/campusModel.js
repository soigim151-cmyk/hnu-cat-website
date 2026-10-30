import { useGLTF } from '@react-three/drei'
import { setDownloadProgress } from './downloadProgress.js'

// 기기에 맞는 캠퍼스 모델 파일을 고릅니다.
// - 데스크톱: 원본 (텍스처 4096px, 19.7MB)
// - 모바일/작은 화면: 최적화본 (텍스처 2048px WebP, 12.6MB, GPU 메모리 약 1/3)
// 두 파일 모두 형태(지오메트리)는 같습니다.
const ORIGINAL = { url: `${import.meta.env.BASE_URL}models/Campus_3D_Area.glb`, bytes: 19726244 }
const MOBILE = { url: `${import.meta.env.BASE_URL}models/Campus_3D_Area.mobile.glb`, bytes: 12637640 }

function isLightDevice() {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.max(window.screen.width, window.screen.height) < 1024
  return coarse || small
}

const MODEL = isLightDevice() ? MOBILE : ORIGINAL
export const CAMPUS_MODEL_URL = MODEL.url

// ── 다운로드 진행률 ──────────────────────────────
// 모델이 파일 하나라서 "받은 데이터 양"으로 진행률을 계산합니다.
function report(e) {
  const total = e.lengthComputable && e.total ? e.total : MODEL.bytes
  setDownloadProgress(Math.min(1, e.loaded / total))
}

// 로더가 파일을 받을 때 진행률을 알려주도록 연결
export function trackDownload(loader) {
  if (loader.__trackDownload) return
  loader.__trackDownload = true
  const load = loader.load.bind(loader)
  loader.load = (url, onLoad, onProgress, onError) =>
    load(
      url,
      onLoad,
      (e) => {
        report(e)
        onProgress?.(e)
      },
      onError,
    )
}

// 시작 페이지에서 미리 호출해 모델을 백그라운드로 받아둡니다.
export function preloadCampus() {
  useGLTF.preload(CAMPUS_MODEL_URL, true, true, trackDownload)
}
