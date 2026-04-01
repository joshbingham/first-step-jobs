import request from "supertest";
import { jest } from "@jest/globals";

// 1. Create mock FIRST
const mockGetCommuteTime = jest.fn();

// 2. Mock module BEFORE import
jest.unstable_mockModule("../services/commuteService.js", () => ({
  getCommuteTime: mockGetCommuteTime,
}));

// 3. Now import AFTER mocking
const { default: app } = await import("../server.js");

describe("/jobs with commute", () => {
  test("adds commute field to jobs", async () => {
    mockGetCommuteTime.mockResolvedValue({
      durationSeconds: 600,
      durationText: "10 mins",
    });

    const res = await request(app).get("/jobs?location=SW1A1AA&distance=10");

    expect(res.statusCode).toBe(200);

    const jobs = res.body.localJobs || [];

    if (jobs.length > 0) {
      expect(jobs[0]).toHaveProperty("commute");
    }
  });
});