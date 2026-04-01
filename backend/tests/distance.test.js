const { getDistance } = require("../utils/distance");

test("distance between same points is 0", () => {
  expect(getDistance(0, 0, 0, 0)).toBe(0);
});

test("distance increases with separation", () => {
  const d1 = getDistance(0, 0, 1, 1);
  const d2 = getDistance(0, 0, 5, 5);

  expect(d1).toBeLessThan(d2);
});