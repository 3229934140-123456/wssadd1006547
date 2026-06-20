export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateCN = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

export const getDaysDiff = (dateStr1: string, dateStr2: string): number => {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDaysAfterSurgery = (surgeryDate: string, compareDate: string = new Date().toISOString().split('T')[0]): number => {
  return getDaysDiff(surgeryDate, compareDate);
};

export const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

export const isOverdue = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
};

export const isTomorrow = (dateStr: string): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return dateStr === tomorrowStr;
};

export const getRelativeDateLabel = (dateStr: string): string => {
  if (isToday(dateStr)) return '今天';
  if (isTomorrow(dateStr)) return '明天';
  const days = getDaysDiff(new Date().toISOString().split('T')[0], dateStr);
  const date = new Date(dateStr);
  const today = new Date();
  if (date < today) {
    return `${days}天前`;
  }
  return `${days}天后`;
};

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date.toISOString().split('T')[0]);
};

export const getWeekRange = (dateStr: string = new Date().toISOString().split('T')[0]): string[] => {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setDate(date.getDate() - diff);
  const result: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    result.push(formatDate(d.toISOString().split('T')[0]));
  }
  return result;
};

export const getMonthRange = (dateStr: string = new Date().toISOString().split('T')[0]): string[] => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];
  for (let i = 1; i <= lastDay; i++) {
    const d = new Date(year, month, i);
    result.push(formatDate(d.toISOString().split('T')[0]));
  }
  return result;
};

export const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

export const getWeekdayCN = (dateStr: string): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const date = new Date(dateStr);
  return weekdays[date.getDay()];
};
