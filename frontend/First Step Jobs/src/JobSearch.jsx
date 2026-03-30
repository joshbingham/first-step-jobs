import { useState, useEffect } from "react";
import JobCard from "./JobCard";
import Banner from "./Banner";

export default function JobSearch() {
  const [localJobs, setLocalJobs] = useState([]);
  const [remoteJobs, setRemoteJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("match"); 
  const [savedJobs, setSavedJobs] = useState(() => {
    const stored = localStorage.getItem("savedJobs");
    return stored ? JSON.parse(stored) : [];
  });
  const [savedSortBy, setSavedSortBy] = useState("date"); 
  const [usedRadius, setUsedRadius] = useState(null);
  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  


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
  const loadJobs = async () => {
    setLoading(true);
    setError("");

    try {
      const trimmedPostcode = postcode.trim();

      const isValidPostcode =
        /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(trimmedPostcode);

      const isLocal = trimmedPostcode.length > 0 && isValidPostcode;

      // validate postcode only when user is trying local search
      if (trimmedPostcode && !isValidPostcode) {
        setError("Please enter a valid postcode (e.g. SW11 1AA)");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();

      if (keyword) params.append("what", keyword);
      if (salaryMin) params.append("salary_min", salaryMin);
      if (salaryMax) params.append("salary_max", salaryMax);

      // ONLY attach location if local search
      if (isLocal) {
        params.append("location", trimmedPostcode);
        params.append("distance", radius);
      }

      const res = await fetch(
        `http://localhost:5000/jobs?${params.toString()}`
      );

      const data = await res.json();

      setLocalJobs(data.localJobs || []);
      setRemoteJobs(data.remoteJobs || []);
      setHasLoadedRemote(true);
      setUsedRadius(data.usedRadius || radius);

      setView(isLocal ? "local" : "remote");

    } catch (err) {
      console.error("Failed to load jobs:", err);
      setLocalJobs([]);
      setRemoteJobs([]);
    }

    setLoading(false);
  };

  const getMatchDetails = (job) => {
    let score = 30;
    const reasons = [];

    // 1. Keyword match
    if (keyword && job.title) {
      const title = job.title.toLowerCase();
      const search = keyword.toLowerCase();

      if (title.includes(search)) {
        score += 25;
        reasons.push("Strong keyword match");
      } else if (search.split(" ").some(word => title.includes(word))) {
        score += 15;
        reasons.push("Partial keyword match");
      }
    }

  // 2. Salary match (range overlap)
  if ((salaryMin || salaryMax) && job.salary_min && job.salary_max) {
    const jobMin = job.salary_min;
    const jobMax = job.salary_max;

    const userMin = salaryMin || 0;
    const userMax = salaryMax || Infinity;

    const overlaps = jobMax >= userMin && jobMin <= userMax;

    if (overlaps) {
      score += 15;
      reasons.push("Salary overlaps your range");

      // Bonus: stronger match if fully inside range
      if (jobMin >= userMin && jobMax <= userMax) {
        score += 5;
        reasons.push("Fully within your salary range");
      }
    } else {
      score -= 10;
      reasons.push("Outside your salary range");
    }
  }

    // 3. Distance
    if (job.distance && radius) {
      const ratio = job.distance / radius;

      if (ratio <= 0.5) {
        score += 15;
        reasons.push("Very close to you");
      } else if (ratio <= 1) {
        score += 10;
        reasons.push("Within your preferred distance");
      } else if (ratio <= 1.5) {
        score += 0;
        reasons.push("Slightly further than preferred");
      } else {
        score -= 10;
        reasons.push("Far from your location");
      }
    }

    if (job.created) {
      const daysOld = (Date.now() - new Date(job.created)) / (1000 * 60 * 60 * 24);

      if (daysOld <= 3) {
        score += 10;
        reasons.push("Recently posted");
      } else if (daysOld <= 7) {
        score += 5;
        reasons.push("Posted this week");
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons,
    };
  };

  

  const sortedLocalJobs = [...localJobs].sort((a, b) => {

    if (sortBy === "match") {
      return (
        getMatchDetails(b).score - getMatchDetails(a).score
      );
    }

    if (sortBy === "date") {
      return new Date(b.created || 0) - new Date(a.created || 0);
    }

    // default: distance
    return (a.distance ?? Infinity) - (b.distance ?? Infinity);
  });

  const sortedRemoteJobs = [...remoteJobs].sort((a, b) => {
    if (sortBy === "match") {
      return getMatchDetails(b).score - getMatchDetails(a).score;
    }

    // default: newest first
    return new Date(b.created || 0) - new Date(a.created || 0);
  });

  const sortedSavedJobs = [...savedJobs].sort((a, b) => {
    if (savedSortBy === "distance") {
      return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    }

    // default: newest first
    return new Date(b.created || 0) - new Date(a.created || 0);
  });

  useEffect(() => {
    if (!keyword && !postcode) return;

    const delay = setTimeout(() => {
      loadJobs();
    }, 500); // slightly slower = fewer spam calls

    return () => clearTimeout(delay);
  }, [searchTrigger]);

  const buildSearchSummary = () => {
    const parts = [];

    if (keyword) parts.push(`“${keyword}” jobs`);
    if (postcode) parts.push(`near ${postcode}`);
    if (radius) parts.push(`within ${radius} miles`);
    if (salaryMin || salaryMax) {
      parts.push(
        `salary ${salaryMin || "0"} - ${salaryMax || "∞"}`
      );
    }

    return parts.join(" • ");
  };

  return (
    <div>
      <h1 className="page-title">First Step Jobs</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Keyword (e.g. developer)"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setSearchTrigger(prev => prev + 1);
          }}
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

            setSearchTrigger(prev => prev + 1);
          }}
        />

        <select
          value={radius}
          onChange={(e) => {
            setRadius(Number(e.target.value));
            setSearchTrigger(prev => prev + 1);
          }}
        >
          <option value={5}>5 miles</option>
          <option value={10}>10 miles</option>
          <option value={20}>20 miles</option>
          <option value={50}>50 miles</option>
        </select>
      </div>

      <Banner
        loading={loading}
        text={
          loading
            ? `Searching for ${buildSearchSummary()}...`
            : `Showing results for ${buildSearchSummary() || "all jobs"}`
        }
      />

      <div className="salary-bar">
        <input
          type="number"
          placeholder="Min Salary"
          value={salaryMin}
          onChange={(e) => {
            setSalaryMin(e.target.value);
            setSearchTrigger(prev => prev + 1);
          }}
        />

        <input
          type="number"
          placeholder="Max Salary"
          value={salaryMax}
          onChange={(e) => {
            setSalaryMax(e.target.value);
            setSearchTrigger(prev => prev + 1);
          }}
        />
      </div>

      {/* ERROR + HELP */}
      {error && <p className="error-text">{error}</p>}

      {!postcode.trim() && (
        <p className="helper-text">
          Enter a postcode to enable “Near Me Jobs”
        </p>
      )}

      
      
      {/* RESULTS */}
      <div>
        {/* LOCAL */}
        {view === "local" && (
          <>
            <h2>Jobs Near You</h2>

            {usedRadius > radius && (
              <p style={{ color: "gray" }}>
                Showing jobs within {usedRadius} miles (expanded from {radius} miles)
              </p>
            )}

            {localJobs.length === 0 && !loading && (
              <p>No local jobs found.</p>
            )}

            <ul>
              {sortedLocalJobs.map((job) => {
                const match = getMatchDetails(job);
                
                return (
                  <JobCard
                    key={job.id || `remotive-${job.redirect_url}`}
                    job={job}
                    match={match}
                    onSave={toggleSaveJob}
                    isSaved={isSaved(job)}
                    showDistance={true}
                  />
               );
              })}
            </ul>
          </>
        )}

        {/* REMOTE */}
        {view === "remote" && (
          <>
            {remoteJobs.length > 0 && <h2>Remote Jobs</h2>}

            {hasLoadedRemote && remoteJobs.length === 0 && !loading && (
              <p>No remote jobs found.</p>
            )}

            <ul>
              {sortedRemoteJobs.map((job) => {

                const match = getMatchDetails(job);
                
                return (
                  <JobCard
                    key={job.id || `remotive-${job.redirect_url}`}
                    job={job}
                    match={match}
                    onSave={toggleSaveJob}
                    isSaved={isSaved(job)}
                    showDistance={false}
                  />
                );
              })}
            </ul>
          </>
        )}
        {view === "saved" && (
          <>
            <h2>Saved Jobs</h2>

            {savedJobs.length === 0 && <p>No saved jobs yet.</p>}
            {view === "saved" && savedJobs.length > 0 && (
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <label style={{ marginRight: "8px" }}>Sort saved jobs:</label>

                <select
                  value={savedSortBy}
                  onChange={(e) => setSavedSortBy(e.target.value)}
                >
                  <option value="match">Best match</option>
                  <option value="date">Newest first</option>
                  <option value="distance">Closest first</option>
                </select>
              </div>
            )}
            <ul>
              {sortedSavedJobs.map((job) => {
                const match = getMatchDetails(job);

                return (
                  <JobCard
                    key={job.id || `remotive-${job.redirect_url}`}
                    job={job}
                    match={match}
                    onRemove={toggleSaveJob}
                    isSaved={isSaved(job)}
                    showDistance={false}
                  />
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}