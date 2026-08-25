const numerals: readonly (readonly [string, number])[] = [
  ["M", 1000],
  ["CM", 900],
  ["D", 500],
  ["CD", 400],
  ["C", 100],
  ["XC", 90],
  ["L", 50],
  ["XL", 40],
  ["X", 10],
  ["IX", 9],
  ["V", 5],
  ["IV", 4],
  ["I", 1],
];

export const toRoman = (value: number): string => {
  if (!Number.isInteger(value) || value < 1 || value > 3999) return "";
  let remaining = value;
  let result = "";
  for (const [symbol, amount] of numerals) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  }
  return result;
};
