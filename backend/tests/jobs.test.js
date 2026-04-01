test("jobs pipeline placeholder test", () => {
  const jobs = [
    { latitude: 1, longitude: 1 },
    { latitude: 2, longitude: 2 }
  ];

  expect(jobs.length).toBe(2);
});