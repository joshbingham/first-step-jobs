// JobSearch.jsx
import { useState } from "react";

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/jobs");
      const data = await res.json();
      console.log(data); // see exactly what the fetch returns
      setJobs(data);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>First Step Jobs</h1>
      <button onClick={loadJobs}>{loading ? "Loading..." : "Load Jobs"}</button>
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            <a href={job.redirect_url} target="_blank" rel="noopener noreferrer">
              {job.title} - {job.company.display_name} ({job.location.display_name})
            </a>
            <p>£{job.salary_min} - £{job.salary_max}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}