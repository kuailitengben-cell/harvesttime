/**
 * 日本語の大きな単位（万、億、兆、京、垓...）に対応した高精度数値フォーマッター
 * 画面崩れを防ぐ短縮表示と、タップによる正確な1単位表示を両立する。
 */

export const JAPANESE_UNITS = [
  '',
  '万',
  '億',
  '兆',
  '京',
  '垓',
  '秭',
  '穣',
  '溝',
  '澗',
  '正',
  '載',
  '極',
  '恒河沙',
  '阿僧祇',
  '那由他',
  '不可思議',
  '無量大数',
];

/**
 * 巨大数値を日本語単位に短縮フォーマット (上位3〜4桁表示)
 * 例:
 * 9,999 -> "9,999"
 * 12,345 -> "1.23万"
 * 1,234,567 -> "123.5万"
 * 123,456,789 -> "1.235億"
 */
export function formatLargeNumber(value: number | bigint | string, suffix = ''): string {
  if (value === null || value === undefined) return `0${suffix}`;

  const num = typeof value === 'bigint' ? Number(value) : typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return `0${suffix}`;
  if (num < 10000 && num > -10000) {
    return `${Math.round(num).toLocaleString()}${suffix}`;
  }

  const isNegative = num < 0;
  let absVal = Math.abs(num);

  let unitIndex = 0;
  while (absVal >= 10000 && unitIndex < JAPANESE_UNITS.length - 1) {
    absVal /= 10000;
    unitIndex++;
  }

  // 小数点以下の桁数を値の大きさに応じて調整
  let formattedDigits: string;
  if (absVal >= 100) {
    formattedDigits = absVal.toFixed(1);
  } else if (absVal >= 10) {
    formattedDigits = absVal.toFixed(2);
  } else {
    formattedDigits = absVal.toFixed(3);
  }

  // 末尾の不要なゼロを除去 (e.g. 1.20 -> 1.2, 1.00 -> 1)
  formattedDigits = formattedDigits.replace(/\.?0+$/, '');

  const unit = JAPANESE_UNITS[unitIndex] || '';
  return `${isNegative ? '-' : ''}${formattedDigits}${unit}${suffix}`;
}

/**
 * 1単位まで正確なカンマ区切り表記
 */
export function formatExactNumber(value: number | bigint | string, suffix = ''): string {
  if (value === null || value === undefined) return `0${suffix}`;
  const num = typeof value === 'bigint' ? Number(value) : typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return `0${suffix}`;
  return `${Math.round(num).toLocaleString()}${suffix}`;
}
