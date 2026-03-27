import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = 5000;

// 📏 Haversine formula (distance in km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.get("/jobs", async (req, res) => {
  console.log("🔥 /jobs route hit");
  console.log("REQ QUERY:", req.query);

  try {
    const { what, location, distance, salary_min, salary_max } = req.query;

    const minSalary = salary_min ? Number(salary_min) : null;
    const maxSalary = salary_max ? Number(salary_max) : null;

    const distanceKm = distance ? Number(distance) * 1.609 : null;

    let userLat = null;
    let userLon = null;

    const MIN_RESULTS = 10;

    // 📍 Postcode → lat/lon
    if (location) {
      try {
        const geoRes = await axios.get(
          `https://api.postcodes.io/postcodes/${location}`
        );

        userLat = geoRes.data.result.latitude;
        userLon = geoRes.data.result.longitude;

      } catch (err) {
        console.log("⚠️ Invalid postcode, skipping distance filter");
        userLat = null;
        userLon = null;
      }
    }

    // =========================
    // 🧠 1. FETCH ADZUNA
    // =========================
    const radiusSteps = [distance || 10, 20, 50];
    let adzunaJobs = [];
    let usedRadius = Number(distance) || 10;

    for (const radiusMiles of radiusSteps) {
      usedRadius = radiusMiles;
      console.log(`🔍 Searching within ${radiusMiles} miles`);

      const responses = await Promise.all(
        [1, 2, 3].map(page =>
          axios.get(`https://api.adzuna.com/v1/api/jobs/gb/search/${page}`, {
            params: {
              app_id: process.env.ADZUNA_APP_ID,
              app_key: process.env.ADZUNA_APP_KEY,
              what: what || "",
              where: location || "",
              distance: radiusMiles, // 👈 KEY LINE
              results_per_page: 50,
            },
          })
        )
      );

      const jobsBatch = responses.flatMap(res =>
        res.data.results.map(job => ({
          ...job,
          source: "adzuna",
          created: job.created,
        }))
      );

      adzunaJobs = jobsBatch;

      // ✅ STOP if enough jobs found
      if (adzunaJobs.length >= MIN_RESULTS) {
        console.log(`✅ Found ${adzunaJobs.length} jobs at ${radiusMiles} miles`);
        break;
      }
    }

    // =========================
    // 🧠 2. FETCH REMOTIVE
    // =========================
    const remotiveRes = await axios.get(
      "https://remotive.com/api/remote-jobs",
      {
        params: {
          search: what || "",
        },
      }
    );

    const remotiveJobs = remotiveRes.data.jobs;

    const remotiveMapped = remotiveJobs.map((job) => ({
      title: job.title,
      company: {
        display_name: job.company_name,
      },
      location: {
        display_name: job.candidate_required_location,
      },
      salary_min: null,
      salary_max: null,
      redirect_url: job.url,
      latitude: null,
      longitude: null,
      source: "remotive",
      isRemote: true,
      created: job.publication_date,
    }));

    console.log("Remotive jobs:", remotiveMapped.length);

    // =========================
    // 🧠 3. FETCH ARBEITNOW
    // =========================

    let arbeitnowJobs = [];

    try {
      const arbeitRes = await axios.get(
        "https://www.arbeitnow.com/api/job-board-api"
      );

      arbeitnowJobs = arbeitRes.data.data.map((job) => ({
        title: job.title,
        company: {
          display_name: job.company_name || "Unknown",
        },
        location: {
          display_name: job.location || "Remote",
        },
        salary_min: null,
        salary_max: null,
        redirect_url: job.url,
        latitude: null,
        longitude: null,
        source: "arbeitnow",
        isRemote: job.remote ?? true,
        created: job.created_at,
      }));

      console.log("Arbeitnow jobs:", arbeitnowJobs.length);

    } catch (err) {
      console.log("⚠️ Arbeitnow failed:", err.message);
    }
    // =========================
    // 🔗 4. MERGE JOBS
    // =========================
    let jobs = [
      ...adzunaJobs,
      ...remotiveMapped,
      ...arbeitnowJobs,
    ];

    const uniqueJobs = Array.from(
      new Map(
        jobs.map(job => [
          `${job.title}-${job.company?.display_name}-${job.location?.display_name}`,
          job
        ])
      ).values()
    );

    jobs = uniqueJobs;



    // =========================
    // 📍 4. GET DISTANCE
    // =========================
    if (userLat && userLon && distanceKm) {
      jobs = jobs
        .map((job) => {
          if (!job.latitude || !job.longitude) return job; // keep non-geolocated (Remotive)

          const jobDistance = getDistance(
            userLat,
            userLon,
            job.latitude,
            job.longitude
          );

          return {
            ...job,
            distance: jobDistance,
          };
        })
        
    }

    // =========================
    // 🧪 DEBUG OUTPUT
    // =========================
    console.log(
      jobs.slice(0, 10).map(j => ({
        title: j.title,
        source: j.source,
        lat: j.latitude,
        lon: j.longitude,
        distance: j.distance
      }))
    );

    console.log(jobs.map(j => j.source));

    console.log(jobs[0].created);

    const localJobs = jobs
      .filter(job => job.latitude && job.longitude)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    const remoteJobs = jobs.filter(
      job => job.source === "remotive" || !job.latitude || !job.longitude
    );

    res.json({
      localJobs,
      remoteJobs,
      usedRadius
    });

  } catch (error) {
    console.error(
      "Error fetching jobs:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
