# HNU CAT WEBSITE

「한남대 고양이가 학생이 되었다!」: 한남대학교 고양이를 소개하는 인터랙티브 캠퍼스 웹사이트

React + Vite · Three.js · React Three Fiber · Drei · GSAP

## 실행 방법

```bash
npm install     # 처음 한 번만
npm run dev     # 개발 서버 → http://localhost:5173
```

## 폴더 구조

```
public/
  images/          Figma에서 내보낸 원본 이미지
    map_image.png  캠퍼스 지도 원본 (화면에는 압축한 map_image.webp 사용, 왼쪽 아래 휜 도로만 곧게 보정)
    map_depth_ai.webp  Depth Anything V2 결과 원본 (색 표시)
    map_depth.png  깊이 지도 (흰색 = 가까움). 더 정확한 지도로 같은 이름으로 교체 가능
    map_ids.png    건물 위치 지도 (픽셀 값 1~5 = data/buildings.js 순서) → 외곽선용
    map_hover.png  마우스 판정용 지도 (구역을 약 45px 넓힘, 서로 겹치지 않음)
    인사례교양동_marker.png  이름표 디자인 원본 (화면 이름표는 이 디자인을 HTML 글자로 재현)
    정문_image.png  시작 페이지 정문 원본 (새 버전으로 교체, 화면에는 gate.webp 사용)
    cat_image/     고양이 사진·동영상 원본 (업로드한 그대로)
    gallery/       갤러리용 변환본 (_s = 목록용 작은 사진, _l = 크게 보기용, cat_video.mp4 = H.264 변환)
    maker_image.png  장소 마커 원본 (화면에는 흰 테두리를 넣고 작게 줄인 marker_outline.png 사용)
    deco/          Decorations.png를 요소별로 자른 이미지 (별·반짝이·발바닥)
  models/
    Campus_3D_Area.glb         원본 모델 (데스크톱용)
    Campus_3D_Area.mobile.glb  최적화본 (모바일용, 텍스처 2048px WebP)
src/
  pages/StartPage.jsx    시작 페이지 (+ StartPage.css)
  pages/CampusPage.jsx   3D 캠퍼스 페이지 (+ CampusPage.css)
  components/CampusScene.jsx  3D 장면: 카메라 구도, 회전 제한, 조명
  components/campusModel.js   기기별 모델 파일 선택
  components/MapScene.jsx    2.5D 캠퍼스 지도 (기본 화면): 사진 + 깊이 지도 + 건물 외곽선
  components/mapAssets.js    지도 이미지·깊이 지도·건물 위치 지도 불러오기
  components/viewMode.js     화면 방식 선택 (주소 뒤 ?view=3d → 예전 3D 모델 화면)
  components/CampusBuildings.jsx  (3D 화면용) 클릭 가능한 건물 + 외곽선
  data/buildings.js      장소 이름·캐릭터·3D 위치
  styles/global.css      색상·폰트 등 디자인 토큰
```

## 자주 바꾸는 값

| 무엇 | 파일 | 위치 |
|---|---|---|
| 색상 | `src/styles/global.css` | `:root` |
| 시작 페이지 요소 위치 | `src/pages/StartPage.jsx` | `STARS`, `PAW`, `pos({...})` (Figma 1440×1014 좌표) |
| 카메라 각도·회전 범위 | `src/components/CampusScene.jsx` | `VIEW` |
| 갤러리 사진 설명(캡션)·순서 | `src/data/gallery.js` | `caption` |
| 갤러리 줄 구성·흐르는 속도 | `src/components/CatGallery.jsx` | `ROWS`, `ROW_SECONDS` (초 = 한 바퀴) |
| 장소 이름·캐릭터 | `src/data/buildings.js` | `name`, `characters` |
| 2.5D 지도 입체감·회전 범위 | `src/components/MapScene.jsx` | `MAP` (`depthRange`, `azimuthRange`, `polarDown`, `polarUp`) |
| 2.5D 외곽선 색·두께 | `src/components/MapScene.jsx` | `OUTLINE_COLOR`, `OUTLINE_RADIUS` |
| 마커 위치·떠 있는 높이 | `src/components/MapScene.jsx` | `MARKER_DEPTH`, `MARKER_LIFT` |
| 마커 크기·둥실거림 | `src/components/MapMarkers.css` | `--marker-w`, `map-marker-bob` |
| 이름표 문구 (이름·건물 번호) | `src/data/buildings.js` | `name`, `number` |
| 이름표 색·글자 크기 | `src/components/MapMarkers.css` | `.map-marker__label` |

## 모바일용 모델 다시 만들기

원본 GLB를 교체했다면 아래 명령으로 최적화본을 다시 만듭니다.

```bash
npx @gltf-transform/cli resize public/models/Campus_3D_Area.glb tmp.glb --width 2048 --height 2048
npx @gltf-transform/cli webp tmp.glb tmp2.glb --quality 85
npx @gltf-transform/cli meshopt tmp2.glb public/models/Campus_3D_Area.mobile.glb --level medium
rm tmp.glb tmp2.glb
```
