import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import { getDistance } from "./utils/distance.js";
import { getCommuteTime } from "./services/commuteService.js";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Job API is running 🚀",
    endpoints: ["/jobs", "/commute", "/test-commute"]
  });
});

/* =========================
   JOBS ENDPOINT (CLEAN)
========================= */
app.get("/jobs", async (req, res) => {
  console.log("🔥 /jobs route hit");

  try {
    const { what, location, distance, salary_min, salary_max } = req.query;

    const radiusMiles = Number(distance) || 10;
    const MIN_RESULTS = 10;

    let userLat = null;
    let userLon = null;

    /* =========================
       POSTCODE → LAT/LON
    ========================== */
    if (location) {
      try {
        const geoRes = await axios.get(
          `https://api.postcodes.io/postcodes/${location}`
        );

        userLat = geoRes.data.result.latitude;
        userLon = geoRes.data.result.longitude;
      } catch (err) {
        console.log("⚠️ Invalid postcode");
      }
    }

    /* =========================
       1. ADZUNA
    ========================== */
    let adzunaJobs = [];

    try {
      const isPostcode = location && /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(location);

      const response = await axios.get(
        "https://api.adzuna.com/v1/api/jobs/gb/search/1",
        {
          params: {
            app_id: process.env.ADZUNA_APP_ID,
            app_key: process.env.ADZUNA_APP_KEY,
            what: what || "",
            where: isPostcode ? location : "",
            distance: radiusMiles,
            results_per_page: 50,
          },
        }
      );

      adzunaJobs = response.data.results.map((job) => ({
        ...job,
        source: "adzuna",
      }));

      console.log("✅ Adzuna success");
    } catch (err) {
      console.log("❌ Adzuna FAILED:");
      console.log(err.response?.data || err.message);
    }

    

    /* =========================
       2. REMOTIVE
    ========================== */
    const remotiveRes = await axios.get(
      "https://remotive.com/api/remote-jobs",
      {
        params: { search: what || "" },
      }
    );

    const remotiveJobs = remotiveRes.data.jobs.map((job) => ({
      title: job.title,
      company: { display_name: job.company_name },
      location: { display_name: job.candidate_required_location },
      salary_min: null,
      salary_max: null,
      redirect_url: job.url,
      latitude: null,
      longitude: null,
      source: "remotive",
      created: job.publication_date,
    }));

    /* =========================
       3. ARBEITNOW
    ========================== */
    let arbeitnowJobs = [];

    try {
      const arbeitRes = await axios.get(
        "https://www.arbeitnow.com/api/job-board-api"
      );

      arbeitnowJobs = arbeitRes.data.data.map((job) => ({
        title: job.title,
        company: { display_name: job.company_name || "Unknown" },
        location: { display_name: job.location || "Remote" },
        salary_min: null,
        salary_max: null,
        redirect_url: job.url,
        latitude: null,
        longitude: null,
        source: "arbeitnow",
        isRemote: job.remote ?? true,
        created: job.created_at,
      }));
    } catch (err) {
      console.log("⚠️ Arbeitnow failed");
    }

    /* =========================
       MERGE + DEDUPE
    ========================== */
    let jobs = [...adzunaJobs, ...remotiveJobs, ...arbeitnowJobs];

    jobs = Array.from(
      new Map(
        jobs.map((job) => [
          `${job.title}-${job.company?.display_name}-${job.location?.display_name}`,
          job,
        ])
      ).values()
    );

    console.log("SAMPLE JOB:", jobs[0]);

    /* =========================
       DISTANCE ONLY (NO COMMUTE HERE)
    ========================== */
    if (userLat && userLon) {
      jobs = jobs.map((job) => {
        if (!job.latitude || !job.longitude) return job;

        const distanceKm = getDistance(
          userLat,
          userLon,
          job.latitude,
          job.longitude
        );

        return {
          ...job,
          distance: distanceKm,
          hasCoords: true,
        };
      });
    }

    /* =========================
       SPLIT RESULTS
    ========================== */
    const localJobs = jobs
      .filter((job) => job.latitude && job.longitude)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    const remoteJobs = jobs.filter(
      (job) =>
        job.source === "remotive" ||
        job.isRemote ||
        !job.latitude ||
        !job.longitude
    );

    res.json({
      localJobs,
      remoteJobs,
      usedRadius: radiusMiles,
      userLocation: {
        lat: userLat,
        lon: userLon,
      },
    });
  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch jobs",
      details: err.message,
    });
  }
});

/* =========================
   TEST COMMUTE ENDPOINT
========================= */
app.get("/test-commute", async (req, res) => {
  const result = await getCommuteTime(
    51.5074,
    -0.1278,
    51.5171,
    -0.1062
  );

  res.json(result);
});

app.get("/commute", async (req, res) => {
  try {
    const { originLat, originLon, destLat, destLon, mode } = req.query;

    if (!originLat || !originLon || !destLat || !destLon) {
      return res.status(400).json({ error: "Missing coordinates" });
    }

    const result = await getCommuteTime(
      Number(originLat),
      Number(originLon),
      Number(destLat),
      Number(destLon),
      mode || "driving"
    );
  

    res.json(result);
  } catch (err) {
    console.error("Commute error:", err.message);
    res.status(500).json({ error: "Failed to calculate commute" });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;