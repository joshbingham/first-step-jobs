import { getCommuteTime } from "../services/commuteService.js";

describe("commuteService - getCommuteTime (mock)", () => {
  test("returns an object with durationSeconds and durationText", async () => {
    const result = await getCommuteTime("London", "Cambridge");

    // shape checks
    expect(typeof result).toBe("object");
    expect(result).not.toBeNull();

    expect(result).toHaveProperty("durationSeconds");
    expect(result).toHaveProperty("durationText");

    // type checks
    expect(typeof result.durationSeconds).toBe("number");
    expect(typeof result.durationText).toBe("string");

    // value sanity check (mock)
    expect(result.durationSeconds).toBe(806);
    expect(result.durationText).toBe("13 mins");
  });
});