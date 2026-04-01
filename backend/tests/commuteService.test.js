import { jest } from "@jest/globals";
import axios from "axios";
import { getCommuteTime } from "../services/commuteService.js";

describe("commuteService - getCommuteTime (API)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns parsed commute time from API response", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test_key";

    jest.spyOn(axios, "get").mockResolvedValue({
      data: {
        rows: [
          {
            elements: [
              {
                status: "OK",
                duration: {
                  value: 900,
                  text: "15 mins",
                },
              },
            ],
          },
        ],
      },
    });

    const result = await getCommuteTime(1, 2, 3, 4);

    expect(result).toEqual({
      durationSeconds: 900,
      durationText: "15 mins",
    });
  });

  test("returns null if API status not OK", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test_key";

    jest.spyOn(axios, "get").mockResolvedValue({
      data: {
        rows: [
          {
            elements: [
              {
                status: "ZERO_RESULTS",
              },
            ],
          },
        ],
      },
    });

    const result = await getCommuteTime(1, 2, 3, 4);

    expect(result).toBeNull();
  });

  test("returns null if API fails", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test_key";

    jest.spyOn(axios, "get").mockRejectedValue(new Error("API error"));

    const result = await getCommuteTime(1, 2, 3, 4);

    expect(result).toBeNull();
  });
});