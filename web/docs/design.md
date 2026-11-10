Markdown
# Design System: Ameba Style (Web & Mobile Integrated)

## 1. Design Philosophy
- **Mobile-First:** 모바일에서의 가독성과 터치 편의성을 최우선으로 설계.
- **Minimalism:** 화이트 기반의 깨끗한 레이아웃으로 콘텐츠 집중도 향상.
- **Spindle System:** 일관된 컴포넌트 사용으로 사용자 혼란 방지.

## 2. Color Palette
- **Primary:** `#00C300` (Ameba Green) - 핵심 액션 및 강조.
- **Background:** `#FFFFFF` (White) - 메인 배경.
- **Sub-Background:** `#F8F8F8` / `#F4F4F4` - 섹션 구분 및 리스트 배경.
- **Text:** `#333333` (Main), `#757575` (Sub/Date).
- **Border:** `#E2E2E2` - 아주 얇은 구분선 (1px).

## 3. Typography (Responsive)
- **Base Font:** 'Inter', 'Noto Sans JP', sans-serif.
- **Desktop:** - H1: 24px, Body: 16px.
- **Mobile:** - H1: 20px (모바일 화면에 맞춰 축소).
  - Body: 15px (모바일 가독성을 고려한 최적 크기).
  - Line-height: 1.6 (텍스트가 밀집되지 않도록 여유 있게 설정).

## 4. Mobile Specific Rules (UX)
- **Touch Targets:** 모든 클릭 요소(버튼, 링크)는 최소 `44x44px` 이상의 영역 확보.
- **Navigation:** - 모바일에서는 하단 탭 바(Bottom Navigation) 또는 햄버거 메뉴 활용.
  - 상단 헤더는 스크롤 시 고정(Sticky)되어 로고와 메뉴에 상시 접근 가능하도록 함.
- **Padding:** - 좌우 여백(Gutter): 모바일 기준 최소 `16px` 유지.
- **Forms:** - 입력창(Input) 클릭 시 자동 확대 방지를 위해 폰트 크기 최소 16px 권장.

## 5. Responsive Breakpoints
- **Mobile:** < 768px (1단 세로 구성).
- **Tablet:** 768px ~ 1024px (카드 그리드 적용 시작).
- **Desktop:** > 1024px (최대 컨테이너 폭 `1080px` 고정 및 중앙 정렬).

## 6. UI Components Style
- **Buttons:** 모바일에서는 화면 너비를 가득 채우는 'Full-width Button'을 주로 사용.
- **Cards:** - 모바일에서는 테두리(Border) 대신 연한 배경색(`#F4F4F4`)으로 구역을 나누기도 함.
  - 카드 간격은 모바일에서 `12px`~`16px`로 설정.
- **Shadows:** 그림자는 거의 사용하지 않거나, 아주 부드러운 `0 2px 4px rgba(0,0,0,0.05)` 정도만 허용.

## 7. Interaction
- **Pull to Refresh:** 리스트 화면에서 위로 당겨서 새로고침하는 UX 고려.
- **Loading:** Ameba 특유의 깔끔한 스켈레톤(Skeleton UI) 활용.