import { toRoman } from "../roman";

test("converts workout positions to Roman numerals", () => {
  expect(toRoman(1)).toBe("I");
  expect(toRoman(14)).toBe("XIV");
  expect(toRoman(0)).toBe("");
});
