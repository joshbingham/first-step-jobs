import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 5000;

app.get("/jobs", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/gb/search/1`,
      {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          what: "software developer", // or from query: req.query.what
          results_per_page: 10,
        },
      }
    );

    res.json(response.data.results);
  } catch (error) {
    console.error("Error fetching jobs:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
