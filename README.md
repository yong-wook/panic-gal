# 땅따먹기 (Territory Game)

## 프로젝트 소개
이 프로젝트는 HTML, CSS, JavaScript를 사용하여 개발된 간단한 웹 기반 땅따먹기 게임입니다. 플레이어는 자신의 영역을 확장하고 적의 공격을 피하며 스테이지를 클리어하는 것을 목표로 합니다.

## 주요 기능
- 플레이어 조작 및 영역 확장
- 적 캐릭터 및 충돌 처리
- 다양한 스테이지 배경 (stages 폴더 참고)
- 게임 설정 및 난이도 조절

## 시작하는 방법
1.  이 저장소를 클론하거나 다운로드합니다.
2.  `index.html` 파일을 웹 브라우저에서 엽니다.

## 파일 구조
- `index.html`: 게임의 메인 HTML 파일입니다.
- `css/style.css`: 게임의 스타일을 정의하는 CSS 파일입니다.
- `js/`: 게임 로직을 포함하는 JavaScript 파일들이 있습니다.
    - `main.js`: 게임의 주요 흐름을 제어합니다.
    - `player.js`: 플레이어 관련 로직을 처리합니다.
    - `enemy.js`: 적 캐릭터 관련 로직을 처리합니다.
    - `collision.js`: 충돌 감지 로직을 처리합니다.
    - `config.js`: 게임 설정을 포함합니다.
    - `area.js`, `context.js`, `difficulty.js`, `input.js`, `ui.js`: 기타 게임 구성 요소들입니다.
- `stages/`: 게임 스테이지 배경 이미지 파일들이 있습니다.

## 사용 기술
- HTML5
- CSS3
- JavaScript (ES6+)