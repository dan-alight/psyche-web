export function replaceStringCenterWithEllipsis(
  s: string,
  keepFirst: number,
  keepLast: number
): string {
  if (s.length <= keepFirst + keepLast) return s;
  return `${s.slice(0, keepFirst)}...${s.slice(-keepLast)}`;
}
