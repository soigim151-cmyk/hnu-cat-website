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
    deco/          Decorations.png를 요소별로 자른 이미지 (별·반짝이·발바닥)
  models/
    Campus_3D_Area.glb         원본 모델 (데스크톱용)
    Campus_3D_Area.mobile.glb  최적화본 (모바일용, 텍스처 2048px WebP)
src/
  pages/StartPage.jsx    시작 페이지 (+ StartPage.css)
  pages/CampusPage.jsx   3D 캠퍼스 페이지 (+ CampusPage.css)
  components/CampusScene.jsx  3D 장면: 카메라 구도, 회전 제한, 조명
  components/campusModel.js   기기별 모델 파일 선택
  components/CampusBuildings.jsx  클릭 가능한 건물 + 외곽선
  data/buildings.js      장소 이름·캐릭터·3D 위치
  styles/global.css      색상·폰트 등 디자인 토큰
```

## 자주 바꾸는 값

| 무엇 | 파일 | 위치 |
|---|---|---|
| 색상 | `src/styles/global.css` | `:root` |
| 시작 페이지 요소 위치 | `src/pages/StartPage.jsx` | `STARS`, `PAW`, `pos({...})` (Figma 1440×1014 좌표) |
| 카메라 각도·회전 범위 | `src/components/CampusScene.jsx` | `VIEW` |
| 장소 이름·캐릭터 | `src/data/buildings.js` | `name`, `characters` |
| 외곽선 색·진하기 | `src/components/CampusBuildings.jsx` | `OUTLINE_COLOR`, `OUTLINE_STRENGTH` |

## 모바일용 모델 다시 만들기

원본 GLB를 교체했다면 아래 명령으로 최적화본을 다시 만듭니다.

```bash
npx @gltf-transform/cli resize public/models/Campus_3D_Area.glb tmp.glb --width 2048 --height 2048
npx @gltf-transform/cli webp tmp.glb tmp2.glb --quality 85
npx @gltf-transform/cli meshopt tmp2.glb public/models/Campus_3D_Area.mobile.glb --level medium
rm tmp.glb tmp2.glb
```
