import { useState } from "react";

export default function JobSearch() {
  const [localJobs, setLocalJobs] = useState([]);
  const [remoteJobs, setRemoteJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingView, setLoadingView] = useState(null);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("distance"); // "date" or "distance"
  const [savedJobs, setSavedJobs] = useState(() => {
    const stored = localStorage.getItem("savedJobs");
    return stored ? JSON.parse(stored) : [];
  });
  


  // Inputs
  const [keyword, setKeyword] = useState("");
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState(10);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  // UI state
  const [view, setView] = useState("remote"); // default to remote (more forgiving UX)

  // Save/Unsave jobs
  const toggleSaveJob = (job) => {
    const exists = savedJobs.find(j => j.id === job.id);

    let updated;

    if (exists) {
      updated = savedJobs.filter(j => j.id !== job.id);
    } else {
      updated = [...savedJobs, job];
    }

    setSavedJobs(updated);
    localStorage.setItem("savedJobs", JSON.stringify(updated));
  };

  // Check if a job is saved
  const isSaved = (job) => {
    return savedJobs.some(j => j.id === job.id);
  };

  // Validation
  const hasPostcode = postcode.trim().length > 0;

  const isValidPostcode =
    /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(postcode.trim());

  // ----------------------------
  // MAIN API FUNCTION
  // ----------------------------
  const loadJobs = async (mode) => {
    setLoading(true);
    setLoadingView(mode); // ✅ NEW: track which button is loading
    setError("");

    try {
      // Block invalid local search
      if (mode === "local" && hasPostcode && !isValidPostcode) {
        setError("Please enter a valid postcode (e.g. SW11 1AA)");
        setLoading(false);
        setLoadingView(null);
        return;
      }

      if (mode === "local" && !hasPostcode) {
        setError("Enter a postcode to search nearby jobs");
        setLoading(false);
        setLoadingView(null);
        return;
      }

      const params = new URLSearchParams();

      if (keyword) params.append("what", keyword);
      if (salaryMin) params.append("salary_min", salaryMin);
      if (salaryMax) params.append("salary_max", salaryMax);

      // Only local search uses location
      if (mode === "local") {
        params.append("location", postcode);
        params.append("distance", radius);
      }

      const res = await fetch(
        `http://localhost:5000/jobs?${params.toString()}`
      );

      const data = await res.json();

      setLocalJobs(data.localJobs || []);
      setRemoteJobs(data.remoteJobs || []);

      setView(mode);

    } catch (err) {
      console.error("Failed to load jobs:", err);
      setLocalJobs([]);
      setRemoteJobs([]);
    }

    setLoading(false);
    setLoadingView(null); // ✅ reset button loading state
  };

  const sortedLocalJobs = [...localJobs].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.created || 0) - new Date(a.created || 0);
    }

    // default: distance
    return (a.distance ?? Infinity) - (b.distance ?? Infinity);
  });

  const sortedRemoteJobs = [...remoteJobs].sort((a, b) => {
    return new Date(b.created || 0) - new Date(a.created || 0);
  });

  return (
    <div>
      <h1>First Step Jobs</h1>

      {/* INPUTS */}
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

            const valid =
              /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(value);

            if (valid || value.trim() === "") {
              setError("");
            }
          }}
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

      {/* SALARY */}
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

      {/* ERROR + HELP */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!postcode.trim() && (
        <p style={{ color: "gray" }}>
          Enter a postcode to enable “Near Me Jobs”
        </p>
      )}

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", justifyContent: "center" }}>
        <button
          onClick={() => loadJobs("local")}
          disabled={loading || !postcode.trim()}
        >
          {loading && loadingView === "local"
            ? "Loading..."
            : "Near Me Jobs"}
        </button>

        <button
          onClick={() => loadJobs("remote")}
          disabled={loading}
        >
          {loading && loadingView === "remote"
            ? "Loading..."
            : "Remote Jobs"}
        </button>
      </div>

      <button onClick={() => setView("saved")}>
        Saved Jobs ({savedJobs.length})
      </button>

      <div style={{ marginBottom: "16px", textAlign: "center" }}>
        <label style={{ marginRight: "8px" }}>Sort by:</label>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {view === "local" && (
            <option value="distance">Closest first</option>
          )}
          <option value="date">Newest first</option>
        </select>
      </div>

      {/* RESULTS */}
      <div>
        {/* LOCAL */}
        {view === "local" && (
          <>
            <h2>Jobs Near You</h2>

            {localJobs.length === 0 && !loading && (
              <p>No local jobs found.</p>
            )}

            <ul>
              {sortedLocalJobs.map((job, index) => (
                <li key={job.id || index}>
                  <a
                    href={job.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {job.title} - {job.company?.display_name} (
                    {job.location?.display_name})
                  </a>

                  <p>
                    £{job.salary_min ?? "N/A"} - £{job.salary_max ?? "N/A"}
                  </p>


                  {job.distance && (
                    <p>
                      {(job.distance * 0.621371).toFixed(1)} miles away
                    </p>
                  )}

                  {job.created && (
                    <p>
                      Posted: {new Date(job.created).toLocaleDateString()}
                    </p>
                  )}

                  <button onClick={() => toggleSaveJob(job)}>
                    {isSaved(job) ? "★ Saved" : "☆ Save"}
                  </button>

                </li>
              ))}
            </ul>
          </>
        )}

        {/* REMOTE */}
        {view === "remote" && (
          <>
            <h2>Remote Jobs</h2>

            {remoteJobs.length === 0 && !loading && (
              <p>No remote jobs found.</p>
            )}

            <ul>
              {sortedRemoteJobs.map((job, index) => (
                <li key={job.id || index}>
                  <a
                    href={job.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {job.title} - {job.company?.display_name}
                  </a>

                  <p>{job.location?.display_name || "Remote"}</p>
                  
                  <p>
                    £{job.salary_min ?? "N/A"} - £{job.salary_max ?? "N/A"}
                  </p>
                  {job.created && (
                    <p>
                      Posted: {new Date(job.created).toLocaleDateString()}
                    </p>
                  )}

                  <button onClick={() => toggleSaveJob(job)}>
                    {isSaved(job) ? "★ Saved" : "☆ Save"}
                  </button>

                </li>
              ))}
            </ul>
          </>
        )}
        {view === "saved" && (
          <>
            <h2>Saved Jobs</h2>

            {savedJobs.length === 0 && <p>No saved jobs yet.</p>}

            <ul>
              {savedJobs.map((job, index) => (
                <li key={job.id || index}>
                  <a href={job.redirect_url} target="_blank" rel="noopener noreferrer">
                    {job.title} - {job.company?.display_name}
                  </a>

                  <p>{job.location?.display_name || "Remote"}</p>

                  <p>
                    £{job.salary_min ?? "N/A"} - £{job.salary_max ?? "N/A"}
                  </p>

                  {job.created && (
                    <p>
                      Posted: {new Date(job.created).toLocaleDateString()}
                    </p>
                  )}

                  <button onClick={() => toggleSaveJob(job)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}