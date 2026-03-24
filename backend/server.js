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
    const adzunaRes = await axios.get(
      "https://api.adzuna.com/v1/api/jobs/gb/search/1",
      {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          what: what || "",
          where: location || "",
          results_per_page: 50,
          salary_min: minSalary || undefined,
          salary_max: maxSalary || undefined,
        },
      }
    );

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
    }));

    console.log("Remotive jobs:", remotiveMapped.length);

    // =========================
    // 🔗 3. MERGE JOBS
    // =========================
    let jobs = [
      ...adzunaRes.data.results.map((job) => ({
        ...job,
        source: "adzuna",
      })),
      ...remotiveMapped,
    ];

    // =========================
    // 💰 4. SALARY FILTER
    // =========================
    if (minSalary !== null) {
      jobs = jobs.filter(job => {
        if (!job.salary_min) return true; // keep remotive / unknown salaries
        return job.salary_min >= minSalary;
      });
    }

    if (maxSalary !== null) {
      jobs = jobs.filter(job => {
        if (!job.salary_max) return true;
        return job.salary_max <= maxSalary;
      });
    }

    // =========================
    // 📍 5. DISTANCE FILTER (Adzuna only)
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
        .filter((job) => {
          if (!job.latitude || !job.longitude) return true; // keep Remotive jobs
          return job.distance <= distanceKm;
        });
    }

    // =========================
    // 📊 6. SORT (safe)
    // =========================
    jobs.sort((a, b) => {
      const distA = a.distance ?? 999999;
      const distB = b.distance ?? 999999;
      return distA - distB;
    });

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

    const localJobs = jobs
      .filter(job => job.latitude && job.longitude)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    const remoteJobs = jobs.filter(
      job => job.source === "remotive" || !job.latitude || !job.longitude
    );

    res.json({
      localJobs,
      remoteJobs
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
