import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * 日付フォーマットユーティリティ
 *
 * date-fnsを使用した日本語日付フォーマット関数群
 */

/**
 * 日付を「YYYY年MM月DD日」形式でフォーマット
 *
 * @example
 * formatDate(new Date("2024-01-15")) // "2024年1月15日"
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy年M月d日", { locale: ja });
};

/**
 * 日付を「YYYY/MM/DD」形式でフォーマット
 *
 * @example
 * formatDateShort(new Date("2024-01-15")) // "2024/01/15"
 */
export const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy/MM/dd", { locale: ja });
};

/**
 * 日時を「YYYY年MM月DD日 HH:mm」形式でフォーマット
 *
 * @example
 * formatDateTime(new Date("2024-01-15T14:30:00")) // "2024年1月15日 14:30"
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy年M月d日 HH:mm", { locale: ja });
};

/**
 * 日時を「YYYY/MM/DD HH:mm:ss」形式でフォーマット
 *
 * @example
 * formatDateTimeShort(new Date("2024-01-15T14:30:45")) // "2024/01/15 14:30:45"
 */
export const formatDateTimeShort = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy/MM/dd HH:mm:ss", { locale: ja });
};

/**
 * 時刻を「HH:mm」形式でフォーマット
 *
 * @example
 * formatTime(new Date("2024-01-15T14:30:00")) // "14:30"
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "HH:mm", { locale: ja });
};

/**
 * 相対時間を日本語でフォーマット（「〜前」形式）
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 5)) // "5分前"
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 60 * 2)) // "約2時間前"
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { locale: ja, addSuffix: true });
};

/**
 * 日付を人間に優しい形式でフォーマット
 *
 * - 今日: "今日 HH:mm"
 * - 昨日: "昨日 HH:mm"
 * - それ以外: "YYYY年M月D日 HH:mm"
 *
 * @example
 * formatFriendlyDateTime(new Date()) // "今日 14:30"
 * formatFriendlyDateTime(new Date(Date.now() - 86400000)) // "昨日 10:15"
 */
export const formatFriendlyDateTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return `今日 ${format(dateObj, "HH:mm", { locale: ja })}`;
  }

  if (isYesterday(dateObj)) {
    return `昨日 ${format(dateObj, "HH:mm", { locale: ja })}`;
  }

  return formatDateTime(dateObj);
};

/**
 * ISO 8601形式の日付文字列を生成
 *
 * APIリクエストなどで使用
 *
 * @example
 * toISOString(new Date("2024-01-15T14:30:00")) // "2024-01-15T14:30:00.000Z"
 */
export const toISOString = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * 日付が有効かチェック
 *
 * @example
 * isValidDate(new Date()) // true
 * isValidDate(new Date("invalid")) // false
 */
export const isValidDate = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj instanceof Date && !Number.isNaN(dateObj.getTime());
};

/**
 * 2つの日付が同じ日かチェック
 *
 * @example
 * isSameDay(new Date("2024-01-15T10:00"), new Date("2024-01-15T20:00")) // true
 * isSameDay(new Date("2024-01-15"), new Date("2024-01-16")) // false
 */
export const isSameDay = (
  date1: Date | string,
  date2: Date | string,
): boolean => {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * 日付範囲を日本語でフォーマット
 *
 * @example
 * formatDateRange(new Date("2024-01-15"), new Date("2024-01-20"))
 * // "2024年1月15日 〜 2024年1月20日"
 */
export const formatDateRange = (
  startDate: Date | string,
  endDate: Date | string,
): string => {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  return `${formatDate(start)} 〜 ${formatDate(end)}`;
};
