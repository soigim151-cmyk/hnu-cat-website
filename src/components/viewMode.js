// 캠퍼스 화면 방식
// - 'map' (기본): 사진 기반 2.5D 지도
// - '3d': Meshy 3D 모델 (주소 뒤에 ?view=3d 를 붙이면 비교용으로 볼 수 있음)
const param = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null
export const VIEW_MODE = param === '3d' ? '3d' : 'map'
