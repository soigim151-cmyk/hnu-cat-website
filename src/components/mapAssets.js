import { setDownloadProgress } from './downloadProgress.js'

// 2.5D 지도에 필요한 파일
// - image: 캠퍼스 그림 (디자이너 제공 map_image.png 를 WebP로 압축)
// - depth: 깊이 지도 (흰색 = 가까움, 검은색 = 멂)
// - ids:   건물 위치 지도 (픽셀 값 1~5 = BUILDINGS 순서, 0 = 건물 아님)
const BASE = `${import.meta.env.BASE_URL}images/`
const FILES = [
  { key: 'image', url: `${BASE}map_image.webp`, bytes: 529000 },
  { key: 'depth', url: `${BASE}map_depth.png`, bytes: 56000 },
  { key: 'ids', url: `${BASE}map_ids.png`, bytes: 2000 },
]

// 받은 데이터 양으로 진행률 계산
async function fetchWithProgress(url, onBytes) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} 를 불러오지 못했습니다 (${res.status})`)
  const reader = res.body.getReader()
  const chunks = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    onBytes(value.length)
  }
  return new Blob(chunks)
}

async function blobToImage(blob) {
  const img = new Image()
  img.src = URL.createObjectURL(blob)
  await img.decode()
  return img
}

function imageToPixels(img) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

let promise = null
let result = null

// 한 번만 받고 결과를 재사용합니다 (시작 페이지에서 미리 호출)
export function loadMapAssets() {
  if (promise) return promise
  const total = FILES.reduce((s, f) => s + f.bytes, 0)
  let loaded = 0
  promise = Promise.all(
    FILES.map((f) =>
      fetchWithProgress(f.url, (n) => {
        loaded += n
        setDownloadProgress(Math.min(1, loaded / total))
      }).then(blobToImage),
    ),
  ).then(([image, depth, ids]) => {
    setDownloadProgress(1)
    result = { image, depth: imageToPixels(depth), ids: imageToPixels(ids) }
    return result
  })
  return promise
}

// React Suspense 용: 준비 전이면 기다리게 하고, 준비되면 결과를 돌려줍니다.
export function readMapAssets() {
  if (result) return result
  throw loadMapAssets()
}
