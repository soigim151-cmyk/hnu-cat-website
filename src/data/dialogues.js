// 장소별 대화 (지도에서 장소를 누르면 열림)
//
// 한 줄 = { who, text, before, after }
//   who    : 이름표 (없으면 설명 상자)
//   before : 클릭한 뒤, 이 줄이 나오기 전에 하는 연출
//   after  : 이 줄 타이핑이 끝나면 자동으로 하는 연출 (끝날 때까지 클릭 안 받음)
//   page   : true 면 앞 줄과 같은 말의 다음 페이지 (이름표·이미지 그대로)
// 연출 명령
//   { wait: 초 }                  정적
//   { show: 자세, dur: 초, from }  캐릭터 등장 (from: 'bottom' 이면 아래에서 위로 올라옴)
//   { pose: 자세, dur: 초 }        자세·표정 이미지 교체
//   { rename: 이름, dur: 초 }      이름표 바꾸기 (이후 계속 그 이름)
//   { exit: px, dur: 초 }          캐릭터가 옆으로 이동하며 사라짐
//   { close: 초 }                  대화창 페이드 아웃 후 지도로
//   { enter: 보조인물, dur } / { leave: 보조인물, dur }   실루엣이 화면 가장자리에서 들어오고 나감
//   { reward: 이미지, label }      대화가 끝난 뒤 아이템이 '휙득!' 하고 튀어나옴 (클릭하면 다음으로)
//   { look: true }                 두리번거리듯 화면이 좌우로 살짝 움직임
//   { rise: 자세, dur: 초 }         누워 있다가 벌떡 일어나는 느낌으로 자세 교체
//
// 자세 이미지: public/talk/siyu/<자세>.png  (파일이 없으면 기본 이미지로 대신 표시)
import { LINTON } from './lintonScene.js'
import { HALL } from './hallScene.js'
import { GATE } from './gateScene.js'
import { M56 } from './m56Scene.js'

const T = 'talk/'
const W = (s) => ({ wait: s })
const P = (pose, dur = 0.3) => ({ pose, dur })

export const DIALOGUES = {
  // 린튼공원: 여러 인물 대화 (src/data/lintonScene.js)
  'linton-park': LINTON,
  'student-hall': HALL,
  'side-gate': GATE,
  'memorial-56': M56,

  'insarye-hall': {
    place: '11번 건물 앞, 햇볕이 잘 드는 벤치',
    bg: `${T}bg-insarye.webp`,
    bgm: 'calm', // 배경 음악 (sfx.js)
    // 건너뛰기를 누르면 보여줄 정리
    summary: {
      likes: { siyu: 1 }, // 건너뛰었을 때 오르는 호감도
      name: '인사례교양동 (11번)',
      story: '11번 건물 앞 벤치에서 햇볕을 쬐던 김시유 선배를 만나 이름을 알게 되고, 선배가 참치김밥을 좋아한다는 것도 알게 됐다.',
      info: [
        '1층에 인쇄실 · 문구점 · 서점 · 편의점이 있어요.',
        '일자리센터와 학생들이 쉴 수 있는 공간도 있어요.',
        '필요한 게 있으면 일단 1층부터 가 보면 웬만한 건 해결돼요.',
        '건물 앞 벤치는 오후에 햇볕이 잘 들어요.',
      ],
    },
    main: ['???', '김시유'], // 메인 캐릭터(시유) 대사만 기본 방향, 나머지는 대화창 좌우 반전
    // 새 시유 (시유정면 · 시유미소 · 시유씁쓸 가슴 위 클로즈업). 누운 자세만 예전 그림(siyu/lying*.png)
    character: { folder: `${T}siyu-bust/`, ext: 'webp', fallback: `${T}siyu-bust/base.webp`, lying: `${T}siyu/` },
    // 보조 인물 (실루엣): 화면 오른쪽 가장자리에 크게, 일부만 보이게
    extras: { student: { src: `${T}student.webp`, opacity: 0.55 } },
    typeSpeed: 35, // ms/글자
    gap: 0.3, // 클릭 후 다음 대사까지 기본 텀 (초)
    lines: [
      // SCENE 01. 첫 만남 — 목소리만 들리고, 소리의 출처를 찾은 뒤 시유가 모습을 드러냄
      { text: '11번 건물 앞을 지나가던 중, 어디선가 낯선 목소리가 들려온다.' },
      { who: '???', text: '너 지금 내 일조권 침해 중이야.', after: [W(0.7)] },
      { who: '나', text: '?', after: [W(0.5), { look: true }] },
      { who: '나', text: '어디서 나는 소리지?', after: [W(0.6), { show: 'lying3', dur: 0.6, from: 'bottom' }] },
      { who: '???', text: '저기, 옆으로 조금만 비켜 줄래?' },
      { who: '나', text: '아, 제가 햇빛을 가리고 있었네요. 죄송해요!' },
      { who: '???', text: '응, 이제 딱 좋다. 근데 너 여기 처음 와? 아까부터 두리번거리던데.', before: [W(0.5)] },
      { who: '나', text: '네. 학교가 아직 익숙하지 않아서요.' },
      // SCENE 02. 11번 건물 소개 (학생이 말 걸기 전까지 계속 누워 있음)
      { who: '???', text: '그럼 여긴 기억해 둬. 1층에 인쇄실, 문구점, 서점, 편의점도 있고.' },
      { who: '???', text: '일자리센터랑 쉴 곳도 있어. 웬만한 건 여기서 해결돼.', page: true },
      { who: '???', text: '오후엔 이 벤치에 햇빛도 잘 들고. 사람만 좀 덜 지나가면 딱인데.', before: [W(0.4)], after: [W(1.2)] },
      // SCENE 03. 이름 공개 (학생은 목소리만) — 학생이 말을 걸자 벌떡 일어남
      { who: '학생들', text: '어, 시유야. 여기 있었네?', before: [{ enter: 'student', dur: 0.5 }], after: [W(0.2), { rise: 'voice', dur: 0.35 }] },
      { who: '???', text: '어, 안녕! 수업 끝났어?' },
      { who: '학생들', text: '응. 너 또 여기서 자고 있었냐?' },
      { who: '???', text: '아니거든? 눈만 감고 있었어.', before: [W(0.3), P('frown')] },
      { who: '학생들', text: '알았어, 알았어. 나 먼저 간다.', after: [W(0.3), { leave: 'student', dur: 0.6 }] },
      { who: '나', text: '시유… 선배님이세요?', before: [W(0.6), P('look')] },
      { who: '???', text: '응, 김시유야. 너는?', after: [W(0.3), { rename: '김시유', dur: 0.2 }, { profile: '김시유' }] },
      { who: '나', text: '저는 그냥 학교 구경하고 있었어요.' },
      { who: '김시유', text: '아니, 이름 물어본 거였는데…. 뭐, 다음에 알려줘!', before: [W(0.8), P('blank')] },
      { who: '나', text: '아하하…', after: [P('store'), W(1.0)] },
      // SCENE 04. 편의점으로 이동
      { who: '김시유', text: '아, 배고프다. 1층 편의점 가서 참치김밥이나 사야겠다.', after: [P('sit', 0.2), W(0.5), P('stand', 0.2)] },
      { who: '나', text: '참치김밥 좋아하세요?' },
      { who: '김시유', text: '응! 거의 맨날 그것만 먹어. 오늘은 아직 남아 있으려나.', before: [W(0.4), P('think')] },
      { who: '김시유', text: '너도 필요한 거 있으면 일단 여기 1층부터 가 봐. 그럼 또 봐!', before: [P('turn')] },
      {
        who: '나',
        text: '네, 다음에 봬요.',
        after: [
          W(0.6),
          { exit: 60, dur: 0.7 },
          W(0.5),
          { reward: `${T}id-siyu-v2.png`, label: '김시유 학생증 획득!', note: '(…특이한 선배님이시다.)' },
          { like: 'siyu' },
          W(0.8),
          { complete: { sub: '햇볕 좋은 벤치에서 김시유 선배를 만났다.', items: ['id-card'] } },
        ],
      },
    ],
  },
}

// 시유 자세·표정 이미지 목록 (public/talk/siyu/ 에 같은 이름의 PNG 를 올리면 바로 적용)
export const SIYU_POSES = {
  lying3: '벤치에 엎드려 누워 있음 (눕시유 (2) 1, 학생이 말 걸기 전까지)',
  lying2: '벤치에 누워 있음 (눕시유 (2), 예비)',
  lying: '벤치에 누워 있음 (예비)',
  look: '나를 바라봄',
  closed: '눈을 감음',
  up: '고개를 들어 11번 건물을 봄',
  watch: '지나가는 학생들을 봄',
  voice: '목소리 쪽으로 고개를 돌림',
  frown: '살짝 인상 씀',
  blank: '무표정으로 나를 봄',
  annoyed: '어이없다는 표정',
  store: '편의점 쪽을 봄',
  sit: '앉아 있음',
  stand: '일어섬',
  think: '생각하는 표정',
  turn: '몸은 편의점 쪽, 고개만 돌림',
}
