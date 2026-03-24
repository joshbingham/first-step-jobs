import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = 5000;

// 📏 Haversine formula (distance between coordinates)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

app.get("/jobs", async (req, res) => {
  console.log("🔥 /jobs route hit");
  console.log("REQ QUERY:", req.query);
  try {
    const { what, location, distance, minSalary, maxSalary } = req.query;

    const distanceKm = distance ? Number(distance) * 1.609 : null;

    let userLat = null;
    let userLon = null;

    // 📍 Convert postcode → lat/lon
    if (location) {
      const geoRes = await axios.get(
        `https://api.postcodes.io/postcodes/${location}`
      );

      userLat = geoRes.data.result.latitude;
      userLon = geoRes.data.result.longitude;
    }

    const response = await axios.get(
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

    const remotiveRes = await axios.get(
      "https://remotive.com/api/remote-jobs",
      {
        params: {
          search: what || ""
        }
      }
    );

    const remotiveJobs = remotiveRes.data.jobs;

    console.log("Remotive jobs count:", remotiveJobs.length);
    console.log("Sample:", remotiveJobs.slice(0, 2));




    let jobs = [
      ...response.data.results.map(job => ({
        ...job,
        source: "adzuna"
      })),
      ...remotiveMapped
    ];

    const remotiveMapped = remotiveJobs.map(job => ({
      title: job.title,
      company: {
        display_name: job.company_name
      },
      location: {
        display_name: job.candidate_required_location
      },
      salary_min: null,
      salary_max: null,
      redirect_url: job.url,
      latitude: null,
      longitude: null,
      source: "remotive"
    }));

    // 🎯 Apply REAL distance filter
    if (userLat && userLon && distanceKm) {
      jobs = jobs
        .map((job) => {
          if (!job.latitude || !job.longitude) return null;

          const jobDistance = getDistance(
            userLat,
            userLon,
            job.latitude,
            job.longitude
          );

          return {
            ...job,
            distance: jobDistance, // ✅ attach distance
          };
        })
        .filter((job) => job && job.distance <= distanceKm);
    }

    // SORT by closest first
    jobs = jobs.sort((a, b) => a.distance - b.distance);

    console.log(
      jobs.slice(0, 5).map(j => ({
        title: j.title,
        distance: j.distance
      }))
    );
    res.json(jobs);
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
