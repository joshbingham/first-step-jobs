import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = 5000;

app.get("/jobs", async (req, res) => {
  try {
    // Get query params from frontend
    const {
      keyword,
      location,
      distance,
      minSalary,
      maxSalary,
    } = req.query;

    const response = await axios.get(
      "https://api.adzuna.com/v1/api/jobs/gb/search/1",
      {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,

          // 🔍 User filters
          what: keyword || "",
          where: location || "",

          distance: distance || 10, // default 10km
          results_per_page: 20,

          salary_min: minSalary || undefined,
          salary_max: maxSalary || undefined,
        },
      }
    );

    res.json(response.data.results);
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
