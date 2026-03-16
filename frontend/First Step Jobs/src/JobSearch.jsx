// JobSearch.jsx
import { useState } from "react";

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedField, setSelectedField] = useState("all"); // job field/category

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/jobs");
      const data = await res.json();

      const salaryCap = 30000; // Only show jobs up to £30,000

      const filteredJobs = data.filter((job) => {
        const title = job.title.toLowerCase();
        const categoryTag = job.category?.tag?.toLowerCase() || "";

        const matchesSalary = job.salary_max && job.salary_max <= salaryCap;

        const matchesSearch =
          searchTerm === "" ||
          title.includes(searchTerm.toLowerCase());

        const matchesField =
          selectedField === "all" || categoryTag === selectedField;

        return matchesSalary && matchesSearch && matchesField;
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

      {/* Job field selector */}
      <select
        value={selectedField}
        onChange={(e) => setSelectedField(e.target.value)}
        style={{ marginRight: "8px", padding: "4px" }}
      >
        <option value="all">All Fields</option>
        <option value="it-jobs">IT Jobs</option>
        <option value="teaching-jobs">Teaching Jobs</option>
        {/* Add more fields here if needed */}
      </select>

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