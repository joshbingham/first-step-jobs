// backend/server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Enable CORS so frontend can access this API
app.use(cors());

// Adzuna API credentials
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

// Example: fetch entry-level software jobs in the UK
app.get("/jobs", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/gb/search/1`,
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
          results_per_page: 10,
          what: "junior software developer",
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Map results to simple JSON for frontend
    const jobs = response.data.results.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      redirect_url: job.redirect_url,
    }));

    res.json(jobs);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});