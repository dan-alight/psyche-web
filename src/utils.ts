export function replaceStringCenterWithEllipsis(
  s: string,
  keepFirst: number,
  keepLast: number
): string {
  if (s.length <= keepFirst + keepLast) return s;
  return `${s.slice(0, keepFirst)}...${s.slice(-keepLast)}`;
}

export function localISODateString(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate())
  );
}
