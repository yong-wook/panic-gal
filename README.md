# 땅따먹기 (Territory Game)

## 프로젝트 소개
이 프로젝트는 HTML, CSS, JavaScript를 사용하여 개발된 간단한 웹 기반 땅따먹기 게임입니다. 플레이어는 자신의 영역을 확장하고 적의 공격을 피하며 스테이지를 클리어하는 것을 목표로 합니다.

## 게임 플레이
1.  **스테이지 선택**: 게임 시작 시 랜덤 스테이지를 선택하거나, 특정 스테이지를 선택하여 플레이할 수 있습니다.
2.  **영역 확장**: 플레이어는 안전 영역(이미 점유된 영역 또는 캔버스 테두리)에서 벗어나 이동하며 선을 그립니다. 그린 선이 안전 영역으로 다시 연결되면, 선으로 둘러싸인 영역이 점유됩니다.
3.  **적 회피**: 다양한 종류의 적들이 맵을 돌아다닙니다. 플레이어가 적이나 적이 지나간 자리에 닿으면 생명(Life)을 잃습니다.
4.  **아이템 획득**: 맵에 주기적으로 생성되는 아이템을 획득하여 플레이어에게 유리한 효과(예: 속도 증가)를 얻을 수 있습니다.
5.  **스테이지 클리어**: 모든 적을 제거하거나, 특정 조건을 만족하면 스테이지를 클리어하고 '쇼타임' 모드로 진입합니다.
6.  **쇼타임**: 스테이지 클리어 후 잠시 동안 '쇼타임' 모드가 됩니다. 이 모드에서는 플레이어가 배경 이미지를 자유롭게 탐색할 수 있습니다. 쇼타임이 끝나면 다음 스테이지로 넘어갑니다.
7.  **게임 오버**: 모든 생명을 잃으면 게임 오버가 됩니다.

## 주요 기능 상세
-   **플레이어 조작 및 영역 확장**: 키보드 화살표 키를 사용하여 플레이어를 조작하고, 영역을 점유하여 점수를 획득합니다.
-   **다양한 적 캐릭터**:
    -   **Simple**: 단순한 직선 이동을 하는 적.
    -   **Normal**: 무작위로 방향을 전환하며 이동하는 적.
    -   **Boss**: 플레이어를 추적하며 이동하는 강력한 적.
-   **충돌 감지 및 처리**: 플레이어와 적, 그리고 플레이어가 그린 선 사이의 충돌을 정확하게 감지하여 게임 로직에 반영합니다. 무적 상태 관리 및 메시지 표시 기능도 포함합니다.
-   **아이템 시스템**: 플레이어의 속도를 일시적으로 증가시키는 'Speed Up' 아이템이 주기적으로 생성됩니다.
-   **동적 난이도 조절**: 스테이지가 진행될수록 적의 수, 속도, 종류 등이 점진적으로 증가하여 게임의 난이도가 자동으로 조절됩니다.
-   **스테이지 배경**: `stages` 폴더에 있는 다양한 이미지 파일을 배경으로 사용하여 다채로운 게임 환경을 제공합니다.
-   **게임 설정 및 난이도 조절**: `js/config.js` 및 `js/difficulty.js` 파일을 통해 게임의 다양한 설정과 난이도 관련 수치를 조정할 수 있습니다.

## 시작하는 방법
1.  이 저장소를 클론하거나 다운로드합니다.
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
2.  `index.html` 파일을 웹 브라우저(Chrome, Firefox 등)에서 엽니다.

## 파일 구조
-   `index.html`: 게임의 메인 HTML 파일로, 게임 캔버스와 UI 요소를 포함합니다.
-   `css/style.css`: 게임의 전반적인 스타일(레이아웃, 폰트, 색상 등)을 정의하는 CSS 파일입니다.
-   `js/`: 게임 로직을 포함하는 JavaScript 파일들이 있습니다.
    -   `main.js`: 게임의 초기화, 메인 루프, 스테이지 관리, 아이템 생성 등 게임의 핵심 흐름을 제어합니다.
    -   `player.js`: 플레이어의 이동, 영역 점유 로직, 속도 부스트 효과 등을 처리합니다.
    -   `enemy.js`: 적 캐릭터의 생성, 이동 패턴(Simple, Normal, Boss), 타입별 속성 등을 정의하고 관리합니다.
    -   `collision.js`: 플레이어와 적, 아이템 간의 충돌 감지 및 처리 로직을 담당합니다. 무적 상태 관리 및 메시지 표시 기능도 포함합니다.
    -   `config.js`: 게임의 상수 값(그리드 크기, 플레이어 속도, 아이템 지속 시간 등)을 정의합니다.
    -   `area.js`: 영역 점유 로직 및 점유된 영역 관리를 담당합니다.
    -   `context.js`: 캔버스 및 2D 렌더링 컨텍스트를 설정하고 관리합니다.
    -   `difficulty.js`: 게임 난이도 관련 설정(적의 수, 속도, 생명 등)을 정의하고 스테이지 진행에 따라 난이도를 조절합니다.
    -   `input.js`: 키보드 입력 이벤트를 처리하고 게임 상태에 반영합니다.
    -   `ui.js`: 게임 UI(점수, 생명, 타이머, 게임 오버 화면 등)를 렌더링하고 관리합니다.
-   `stages/`: 게임 스테이지 배경으로 사용되는 이미지 파일들이 있습니다.

## 사용 기술
-   HTML5: 게임의 구조와 콘텐츠를 정의합니다.
-   CSS3: 게임의 시각적인 스타일과 레이아웃을 담당합니다.
-   JavaScript (ES6+): 게임의 모든 동적인 로직과 상호작용을 구현합니다.
-   Canvas API: 게임 그래픽 렌더링에 사용됩니다.

## 개발 환경 설정
특별한 개발 환경 설정은 필요하지 않습니다. 웹 브라우저에서 `index.html` 파일을 열면 바로 게임을 실행할 수 있습니다.

## 기여
이 프로젝트에 기여하고 싶으시다면, 언제든지 Pull Request를 보내주세요! 새로운 기능 제안이나 버그 리포트도 환영합니다.

## 라이선스
이 프로젝트는 MIT 라이선스에 따라 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하십시오.