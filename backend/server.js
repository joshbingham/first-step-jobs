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
   JOBS ENDPOINT (FIXED PAGINATION)
========================= */
app.get("/jobs", async (req, res) => {
  console.log("🔥 /jobs route hit");
  console.log("QUERY PARAMS:", req.query);

  try {
    const {
      what,
      location,
      distance,
      salary_min,
      salary_max,
      page,
      limit
    } = req.query;

    const radiusMiles = Number(distance) || 10;
    const pageNum = Number(page) || 1;
    const pageLimit = Number(limit) || 8;

    let userLat = null;
    let userLon = null;

    // -------------------------
    // POSTCODE → LAT/LON
    // -------------------------
    if (location) {
      try {
        const geoRes = await axios.get(
          `https://api.postcodes.io/postcodes/${location}`
        );

        userLat = geoRes.data.result.latitude;
        userLon = geoRes.data.result.longitude;

        console.log("📍 USER COORDS:", userLat, userLon);
      } catch {
        console.log("⚠️ Invalid postcode");
      }
    }

    // -------------------------
    // ADZUNA (FIXED: NO INTERNAL PAGINATION)
    // -------------------------
    let adzunaJobs = [];

    try {
      const response = await axios.get(
        `https://api.adzuna.com/v1/api/jobs/gb/search/1`, // FIXED HERE
        {
          params: {
            app_id: process.env.ADZUNA_APP_ID,
            app_key: process.env.ADZUNA_APP_KEY,
            what: what || "",
            where: location || "",
            distance: radiusMiles,
            results_per_page: 50,
          },
        }
      );

      adzunaJobs = response.data.results.map(j => ({
        ...j,
        source: "adzuna"
      }));

      console.log("✅ Adzuna:", adzunaJobs.length);
    } catch {
      console.log("❌ Adzuna failed");
    }

    // -------------------------
    // REMOTIVE
    // -------------------------
    const remotiveRes = await axios.get(
      "https://remotive.com/api/remote-jobs",
      { params: { search: what || "" } }
    );

    const remotiveJobs = remotiveRes.data.jobs.map(job => ({
      title: job.title,
      company: { display_name: job.company_name },
      location: { display_name: job.candidate_required_location },
      redirect_url: job.url,
      latitude: null,
      longitude: null,
      source: "remotive",
      created: job.publication_date,
    }));

    // -------------------------
    // ARBEITNOW
    // -------------------------
    let arbeitnowJobs = [];

    try {
      const arbeitRes = await axios.get(
        "https://www.arbeitnow.com/api/job-board-api"
      );

      arbeitnowJobs = arbeitRes.data.data.map(job => ({
        title: job.title,
        company: { display_name: job.company_name || "Unknown" },
        location: { display_name: job.location || "Remote" },
        redirect_url: job.url,
        latitude: null,
        longitude: null,
        source: "arbeitnow",
        isRemote: job.remote ?? true,
        created: job.created_at,
      }));
    } catch {}

    // -------------------------
    // MERGE (single dataset)
    // -------------------------
    let jobs = [...adzunaJobs, ...remotiveJobs, ...arbeitnowJobs];

    jobs = Array.from(
      new Map(
        jobs.map(job => [
          `${job.title}-${job.company?.display_name}-${job.location?.display_name}`,
          job
        ])
      ).values()
    );

    console.log("📦 MERGED JOBS:", jobs.length);

    // -------------------------
    // DISTANCE
    // -------------------------
    if (userLat && userLon) {
      jobs = jobs.map(job => {
        if (!job.latitude || !job.longitude) return job;

        return {
          ...job,
          distance: getDistance(userLat, userLon, job.latitude, job.longitude),
        };
      });
    }

    // -------------------------
    // SPLIT
    // -------------------------
    const localJobs = jobs
      .filter(j => j.latitude && j.longitude)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    const remoteJobs = jobs.filter(
      j => j.source === "remotive" || j.isRemote || !j.latitude
    );

    // -------------------------
    // PAGINATION (ONLY PLACE NOW)
    // -------------------------
    const start = (pageNum - 1) * pageLimit;
    const end = start + pageLimit;

    const paginatedLocalJobs = localJobs.slice(start, end);
    const paginatedRemoteJobs = remoteJobs.slice(start, end);

    const totalLocalPages = Math.ceil(localJobs.length / pageLimit);
    const totalRemotePages = Math.ceil(remoteJobs.length / pageLimit);

    console.log("📊 PAGINATION DEBUG FIXED:", {
      pageNum,
      pageLimit,
      localJobs: localJobs.length,
      remoteJobs: remoteJobs.length,
      totalLocalPages,
      totalRemotePages,
    });

    return res.json({
      localJobs: paginatedLocalJobs,
      remoteJobs: paginatedRemoteJobs,
      totalLocalPages,
      totalRemotePages,
      totalLocalJobs: localJobs.length,
      totalRemoteJobs: remoteJobs.length,
      usedRadius: radiusMiles,
    });

  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

/* COMMUTE ENDPOINT (UNCHANGED) */
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

/* START SERVER */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;