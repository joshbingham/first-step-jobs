// JobSearch.jsx
import { useState } from "react";

export default function JobSearch() {
  const [localJobs, setLocalJobs] = useState([]);
  const [remoteJobs, setRemoteJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // User inputs
  const [keyword, setKeyword] = useState("");
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState(10);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [view, setView] = useState("local"); // "local" | "remote"

  const loadJobs = async () => {
    // 🚫 Block invalid postcode
    const isValidPostcode = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(postcode);

    if (postcode && !isValidPostcode) {
      setError("Please enter a valid postcode (e.g. SW11 1AA)");
      return;
    }
    setLoading(true);

    try {
      // Build query string dynamically
      const params = new URLSearchParams();

      if (keyword) params.append("what", keyword);
      if (postcode) params.append("location", postcode);
      if (radius) params.append("distance", radius);
      if (salaryMin) params.append("salary_min", salaryMin);
      if (salaryMax) params.append("salary_max", salaryMax);

      const res = await fetch(`http://localhost:5000/jobs?${params.toString()}`);
      const data = await res.json();

      setLocalJobs(data.localJobs);
      setRemoteJobs(data.remoteJobs);
      console.log("API response:", data);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setLocalJobs([]);
      setRemoteJobs([]);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>First Step Jobs</h1>

      {/* Filters */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Keyword (e.g. developer)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ marginRight: "8px" }}
        />

        <input
          type="text"
          placeholder="Postcode (e.g. SW11 1AA)"
          value={postcode}
          onChange={(e) => {
            const value = e.target.value;
            setPostcode(value);

            const isValidPostcode = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(value);

            if (isValidPostcode || value.trim() === "") {
              setError(""); // ✅ clear error when valid or empty
            }
          }}
          style={{ marginRight: "8px" }}
        />

        {postcode && postcode.trim().length < 6 && (
          <p style={{ color: "gray", marginTop: "6px" }}>
            💡 Tip: Enter a full postcode (e.g. SW11 1AA) to see jobs.
          </p>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <select
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          style={{ marginRight: "8px" }}
        >
          <option value={5}>5 miles</option>
          <option value={10}>10 miles</option>
          <option value={20}>20 miles</option>
          <option value={50}>50 miles</option>
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="number"
          placeholder="Min Salary"
          value={salaryMin}
          onChange={(e) => setSalaryMin(e.target.value)}
          style={{ marginRight: "8px" }}
        />

        <input
          type="number"
          placeholder="Max Salary"
          value={salaryMax}
          onChange={(e) => setSalaryMax(e.target.value)}
          style={{ marginRight: "8px" }}
        />
      </div>

      {/* Load button */}
      <button onClick={loadJobs}>
        {loading ? "Loading..." : "Search Jobs"}
      </button>

      {/* Results */}
      <div style={{ marginTop: "20px" }}>
        {/* Toggle buttons */}
        <button onClick={() => setView("local")} style={{ marginRight: "8px" }}>
          Near Me Jobs
        </button>
        <button onClick={() => setView("remote")}>
          Remote Jobs
        </button>

        {/* LOCAL JOBS */}
        {view === "local" && (
          <>
            <h2>Jobs Near You</h2>

            {localJobs.length === 0 && !loading && <p>No local jobs found.</p>}

            <ul>
              {localJobs.map((job, index) => (
                <li key={job.id || index} style={{ marginBottom: "16px" }}>
                  <a href={job.redirect_url} target="_blank" rel="noopener noreferrer">
                    {job.title} - {job.company?.display_name} ({job.location?.display_name})
                  </a>

                  <p>
                    £{job.salary_min ?? "N/A"} - £{job.salary_max ?? "N/A"}
                  </p>

                  {job.distance && (
                    <p>{(job.distance * 0.621371).toFixed(1)} miles away</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* REMOTE JOBS */}
        {view === "remote" && (
          <>
            <h2>Remote Jobs</h2>

            {remoteJobs.length === 0 && !loading && <p>No remote jobs found.</p>}

            <ul>
              {remoteJobs.map((job, index) => (
                <li key={job.id || index} style={{ marginBottom: "16px" }}>
                  <a href={job.redirect_url} target="_blank" rel="noopener noreferrer">
                    {job.title} - {job.company?.display_name}
                  </a>

                  <p>{job.location?.display_name || "Remote"}</p>

                  <p>
                    £{job.salary_min ?? "N/A"} - £{job.salary_max ?? "N/A"}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}