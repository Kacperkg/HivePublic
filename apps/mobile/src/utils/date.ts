export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const fromDateKey = (key: string): Date => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 12);
};

export const addDays = (date: Date, amount: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

export const startOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(12, 0, 0, 0);
  return result;
};

export const getWeekDays = (offset = 0, now = new Date()) => {
  const first = addDays(startOfWeek(now), offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const fullDate = addDays(first, index);
    return {
      day: fullDate.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      fullDate,
    };
  });
};

export const monthBounds = (date: Date) => ({
  from: toDateKey(new Date(date.getFullYear(), date.getMonth(), 1, 12)),
  to: toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)),
});
