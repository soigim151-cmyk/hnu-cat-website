// 장소별 대화 (지도에서 장소를 누르면 열림)
//
// 한 줄 = { who, text, before, after }
//   who    : 이름표 (없으면 설명 상자)
//   before : 클릭한 뒤, 이 줄이 나오기 전에 하는 연출
//   after  : 이 줄 타이핑이 끝나면 자동으로 하는 연출 (끝날 때까지 클릭 안 받음)
//   page   : true 면 앞 줄과 같은 말의 다음 페이지 (이름표·이미지 그대로)
// 연출 명령
//   { wait: 초 }                  정적
//   { show: 자세, dur: 초 }        캐릭터 페이드 인
//   { pose: 자세, dur: 초 }        자세·표정 이미지 교체
//   { rename: 이름, dur: 초 }      이름표 바꾸기 (이후 계속 그 이름)
//   { exit: px, dur: 초 }          캐릭터가 옆으로 이동하며 사라짐
//   { close: 초 }                  대화창 페이드 아웃 후 지도로
//
// 자세 이미지: public/talk/siyu/<자세>.png  (파일이 없으면 기본 이미지로 대신 표시)
const T = 'talk/'
const W = (s) => ({ wait: s })
const P = (pose, dur = 0.3) => ({ pose, dur })

export const DIALOGUES = {
  'insarye-hall': {
    place: '11번 건물 앞, 햇볕이 잘 드는 벤치',
    bg: `${T}bg-insarye.webp`,
    character: { folder: `${T}siyu/`, fallback: `${T}char-siyu-v2.webp` },
    typeSpeed: 35, // ms/글자
    gap: 0.3, // 클릭 후 다음 대사까지 기본 텀 (초)
    lines: [
      // SCENE 01. 첫 만남
      { text: '11번 건물 앞을 지나가던 중, 어디선가 낯선 목소리가 들려온다.' },
      { who: '???', text: '너 지금 내 일조권 침해 중이야.', after: [W(0.8), { show: 'lying', dur: 0.4 }] },
      { who: '나', text: '네? 아, 제가 햇빛을 가리고 있었나요?' },
      { who: '???', text: '응. 조금만 옆으로 가봐.', before: [W(0.4)] },
      { who: '나', text: '아, 네. 여기면 괜찮으세요?', before: [W(0.3), P('look')] },
      { who: '???', text: '어. 이제 됐어.', before: [W(0.6), P('closed')] },
      { who: '???', text: '근데 너 여기 처음 와? 아까부터 두리번거리던데.', before: [P('lying'), W(1.0)] },
      { who: '나', text: '네. 학교가 아직 익숙하지 않아서 둘러보고 있었어요.' },
      { who: '???', text: '아, 그래서. 뭘 그렇게 찾나 했네.', before: [W(0.4), P('look')] },
      { who: '나', text: '생각보다 건물이 많아서 좀 헷갈리네요.' },
      // SCENE 02. 11번 건물 소개
      { who: '???', text: '그럼 여긴 기억해 둬. 1층에 인쇄실, 문구점, 서점, 편의점도 있고.', before: [P('up')] },
      { who: '???', text: '일자리센터랑 쉴 곳도 있어. 웬만한 건 여기서 해결돼.', page: true },
      { who: '나', text: '오, 생각보다 이것저것 많네요.' },
      { who: '???', text: '응. 그래서 사람도 많이 오고. 난 좀 조용했으면 좋겠는데.', before: [W(0.4), P('watch')] },
      { who: '나', text: '그런데 여기서 쉬고 계시는 거예요?' },
      { who: '???', text: '응. 여기 오후에 햇빛 잘 들거든. 사람만 좀 덜 지나가면 딱인데.', before: [W(0.5), P('lying')], after: [W(1.2)] },
      // SCENE 03. 이름 공개 (학생은 목소리만)
      { who: '학생', text: '어, 시유야. 여기 있었네?', after: [P('voice')] },
      { who: '???', text: '어. 수업 끝났어?' },
      { who: '학생', text: '응. 너 또 여기서 자고 있었냐?' },
      { who: '???', text: '안 잤거든.', before: [W(0.3), P('frown')] },
      { who: '학생', text: '알았어, 알았어. 나 먼저 간다.' },
      { who: '???', text: '어.' },
      { who: '나', text: '시유 씨라고 하시는군요.', before: [W(0.6), P('look')] },
      { who: '???', text: '응. 김시유. 넌?', after: [W(0.3), { rename: '김시유', dur: 0.2 }] },
      { who: '나', text: '저는 그냥 학교 구경하고 있었어요.' },
      { who: '김시유', text: '이름 물어본 건데.', before: [W(0.8), P('blank')] },
      { who: '나', text: '아, 제 이름이요?' },
      { who: '김시유', text: '아니면 뭐겠어.', before: [W(0.4), P('annoyed')] },
      { who: '나', text: '아하하…', after: [P('store'), W(1.0)] },
      // SCENE 04. 편의점으로 이동
      { who: '김시유', text: '됐다. 배고프네. 편의점이나 가야겠다.', after: [P('sit', 0.2), W(0.5), P('stand', 0.2)] },
      { who: '나', text: '아까 말씀하신 1층 편의점이요?' },
      { who: '김시유', text: '응. 여기 바로 있으니까 편해. 거의 매일 가.' },
      { who: '나', text: '뭐 사러 가세요?' },
      { who: '김시유', text: '간식. 맨날 먹는 것만 먹긴 하는데.', before: [W(0.4), P('think')] },
      { who: '나', text: '좋아하는 게 있으신가 봐요.' },
      { who: '김시유', text: '응. 근데 오늘은 뭘 먹을지 좀 고민되네.' },
      { who: '김시유', text: '아, 그리고 너 학교 처음이라고 했지? 필요한 거 있으면 일단 여기 1층부터 가봐.', before: [P('turn')] },
      { who: '나', text: '네, 알려주셔서 감사합니다.' },
      { who: '김시유', text: '어. 난 간다.', before: [P('stand', 0.2)] },
      {
        who: '나',
        text: '네, 다음에 봬요.',
        after: [W(0.6), { exit: 60, dur: 0.7 }, W(0.5), { close: 0.3 }],
      },
    ],
  },
}

// 시유 자세·표정 이미지 목록 (public/talk/siyu/ 에 같은 이름의 PNG 를 올리면 바로 적용)
export const SIYU_POSES = {
  lying: '벤치에 누워 있음',
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
