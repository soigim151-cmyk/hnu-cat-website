// 캠퍼스 모델 다운로드 진행률 (0~1)
// 로딩 화면이 무거운 3D 코드 없이도 쓸 수 있도록 따로 둔 작은 파일입니다.
let progress = 0
const listeners = new Set()

export function subscribeDownload(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getDownloadProgress = () => progress

export function setDownloadProgress(value) {
  progress = value
  listeners.forEach((l) => l())
}
