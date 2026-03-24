// JobSearch.jsx
import { useState } from "react";

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // User inputs
  const [keyword, setKeyword] = useState("");
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState(10);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const loadJobs = async () => {
    setLoading(true);

    try {
      // Build query string dynamically
      const params = new URLSearchParams();

      if (keyword) params.append("what", keyword);
      if (postcode) params.append("where", postcode);
      if (radius) params.append("distance", radius);
      if (salaryMin) params.append("salary_min", salaryMin);
      if (salaryMax) params.append("salary_max", salaryMax);

      const res = await fetch(`http://localhost:5000/jobs?${params.toString()}`);
      const data = await res.json();

      setJobs(data);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setJobs([]);
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
          placeholder="Postcode (e.g. SG5)"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          style={{ marginRight: "8px" }}
        />

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
      <ul style={{ marginTop: "20px" }}>
        {jobs.map((job) => (
          <li key={job.id} style={{ marginBottom: "16px" }}>
            <a href={job.redirect_url} target="_blank" rel="noopener noreferrer">
              {job.title} - {job.company.display_name} ({job.location.display_name})
            </a>
            <p>
              £{job.salary_min} - £{job.salary_max}
            </p>
          </li>
        ))}
      </ul>

      {jobs.length === 0 && !loading && <p>No jobs found.</p>}
    </div>
  );
}