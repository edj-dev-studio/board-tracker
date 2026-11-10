// 대시보드의 기본 조회 범위: 올해를 포함한 최근 4년
export function recentYearRange(now: Date = new Date()): { startYear: number; endYear: number } {
  const endYear = now.getFullYear();
  return { startYear: endYear - 3, endYear };
}
