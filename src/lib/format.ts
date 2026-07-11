// 순수 포매터 (DB 무관)

export function formatKRW(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    if (man === Math.floor(man)) return `${man.toLocaleString()}만원`;
    return `${man.toLocaleString()}만`;
  }
  return `${amount.toLocaleString()}원`;
}
