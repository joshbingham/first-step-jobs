// JobSearch.jsx
import { useState } from "react";

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all', 'it-jobs', 'teaching-jobs'

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/jobs");
      const data = await res.json();

      // Junior-friendly criteria
      const juniorKeywords = ["junior", "trainee", "graduate", "entry level", "apprentice"];
      const salaryCap = 30000;

      const filteredJobs = data.filter((job) => {
        const title = job.title.toLowerCase();
        const categoryTag = job.category?.tag?.toLowerCase() || "";

        const matchesJunior =
          juniorKeywords.some((kw) => title.includes(kw)) ||
          (job.salary_max && job.salary_max <= salaryCap);

        const matchesSearch =
          searchTerm === "" ||
          title.includes(searchTerm.toLowerCase());

        const matchesCategory =
          categoryFilter === "all" || categoryTag === categoryFilter;

        return matchesJunior && matchesSearch && matchesCategory;
      });

      setJobs(filteredJobs);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setJobs([]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>First Step Jobs</h1>

      {/* Search input */}
      <input
        type="text"
        placeholder="Search by job title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginRight: "8px", padding: "4px" }}
      />

      {/* Category filter buttons */}
      <div style={{ margin: "8px 0" }}>
        <button
          onClick={() => setCategoryFilter("all")}
          style={{ marginRight: "4px", fontWeight: categoryFilter === "all" ? "bold" : "normal" }}
        >
          All
        </button>
        <button
          onClick={() => setCategoryFilter("it-jobs")}
          style={{ marginRight: "4px", fontWeight: categoryFilter === "it-jobs" ? "bold" : "normal" }}
        >
          IT Jobs
        </button>
        <button
          onClick={() => setCategoryFilter("teaching-jobs")}
          style={{ fontWeight: categoryFilter === "teaching-jobs" ? "bold" : "normal" }}
        >
          Teaching Jobs
        </button>
      </div>

      {/* Load jobs button */}
      <button onClick={loadJobs}>{loading ? "Loading..." : "Load Jobs"}</button>

      {/* Jobs list */}
      <ul>
        {jobs.map((job) => (
          <li key={job.id} style={{ marginBottom: "16px" }}>
            <a href={job.redirect_url} target="_blank" rel="noopener noreferrer">
              {job.title} - {job.company.display_name} ({job.location.display_name})
            </a>
            <p>£{job.salary_min} - £{job.salary_max}</p>
          </li>
        ))}
      </ul>

      {jobs.length === 0 && !loading && <p>No jobs found.</p>}
    </div>
  );
}