export function padRight(str: string, totalWidth: number, paddingChar: string) {
  let padStr = str;
  while (padStr.length < totalWidth) {
    padStr += paddingChar;
  }
  return padStr.substring(0, totalWidth);
}
