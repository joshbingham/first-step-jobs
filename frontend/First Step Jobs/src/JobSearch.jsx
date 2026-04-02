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
  const [hasSearched, setHasSearched] = useState(false);
  const [commuteTimes, setCommuteTimes] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [travelMode, setTravelMode] = useState("driving");
  


  // Inputs
  const [keyword, setKeyword] = useState("");
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState(10);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  // UI state
  const [view, setView] = useState(null); // default to remote (more forgiving UX)

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

  // Test commute
  const testCommute = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/commute?originLat=51.5074&originLon=-0.1278&destLat=51.5171&destLon=-0.1062"
      );

      const data = await res.json();

      console.log("COMMUTE RESULT:", data);
    } catch (err) {
      console.error("Test commute failed:", err);
    }
  };

  // Fetch commute time for a job
  const fetchCommuteForJob = async (job) => {
    try {
      if (!job.latitude || !job.longitude) return;
      if (!userLocation?.lat || !userLocation?.lon) return;

      const res = await fetch(
        `http://localhost:5000/commute?originLat=${userLocation.lat}&originLon=${userLocation.lon}&destLat=${job.latitude}&destLon=${job.longitude}&mode=${travelMode}`
      );

      const data = await res.json();

      setCommuteTimes((prev) => ({
        ...prev,
        [String(job.id)]: data,
      }));
    } catch (err) {
      console.error("Commute fetch failed:", err);
    }
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

      const isLocal =
        view === "local" &&
        trimmedPostcode.length > 0 &&
        isValidPostcode;

      const isRemote = view === "remote";

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
      setUserLocation(data.userLocation);

      

      setHasSearched(true);

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
      score += 20;
      reasons.push("Salary matches your range");

      // Bonus: stronger match if fully inside range
      if (jobMin >= userMin && jobMax <= userMax) {
        score += 5;
        reasons.push("Fully within your salary range");
      }
    } else {
      score -= 15;
      reasons.push("Outside your salary range");
    }
  }

    // 3. Distance
    if (view === "local" && job.distance && radius) {
      const ratio = job.distance / radius;

      if (ratio <= 0.5) {
        score += 15;
        reasons.push("Very close to you");
      } else if (ratio <= 1) {
        score += 10;
        reasons.push("Within your preferred distance");
      } else if (ratio <= 1.5) {
        score += 2;
        reasons.push("Slightly further than preferred");
      } else {
        score -= 8;
        reasons.push("Far from your location");
      }
    }

    if (job.created) {
      const daysOld = (Date.now() - new Date(job.created)) / (1000 * 60 * 60 * 24);

      if (daysOld <= 3) {
        score += 12;
        reasons.push("Recently posted");
      } else if (daysOld <= 7) {
        score += 6;
        reasons.push("Posted this week");
      } else if (daysOld > 30) {
        score -= 5;
        reasons.push("Older listing");
      }

    }

    // 4. Remote preference boost (ONLY in remote view)
    if (view === "remote") {
      const text = `${job.title || ""} ${job.description || ""}`.toLowerCase();

      const isRemote =
        text.includes("remote") ||
        text.includes("work from home") ||
        text.includes("fully remote") ||
        text.includes("anywhere") ||
        text.includes("home based");

      if (isRemote) {
        score += 15;
        reasons.push("Remote-friendly role");
      } else {
        score -= 5; // soft penalty, not filtered out
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

  const isRemoteJob = (job) => {
    const text = `${job.title || ""} ${job.description || ""}`.toLowerCase();

    return (
      text.includes("remote") ||
      text.includes("work from home") ||
      text.includes("fully remote") ||
      text.includes("anywhere") ||
      text.includes("home based")
    );
  };

  

  const sortedRemoteJobs = [...remoteJobs].sort((a, b) => {
    if (sortBy === "match") {
      return getMatchDetails(b).score - getMatchDetails(a).score;
    }

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
    if (!view || view === "saved") return;

    const delay = setTimeout(() => {
      loadJobs();
    }, 500);

    return () => clearTimeout(delay);
  }, [searchTrigger]);

  useEffect(() => {
    if (!localJobs.length || !userLocation) return;

    localJobs.forEach((job) => {
      fetchCommuteForJob(job);
    });
  }, [localJobs, userLocation, travelMode]);

  const buildSearchSummary = () => {
    const parts = [];

    if (keyword) parts.push(`“${keyword}” jobs`);

    if (view === "local") {
      if (postcode) parts.push(`near ${postcode}`);
      if (radius) parts.push(`within ${radius} miles`);
    }

    if (salaryMin || salaryMax) {
      parts.push(`salary ${salaryMin || "0"} - ${salaryMax || "∞"}`);
    }

    if (view === "remote") {
      parts.push("remote");
    }

    return parts.join(" • ");
  };

  console.log("COMMUTE STATE SNAPSHOT:", commuteTimes);
  

  return (
    <div>
      <h1 className="page-title">First Step Jobs</h1>

      <div className="view-tabs">
        <button
          className={view === "remote" ? "active" : ""}
          onClick={() => {
            setView("remote");
            setSearchTrigger(prev => prev + 1);
          }}
        >
          🌍 Remote
        </button>

        <button
          className={view === "local" ? "active" : ""}
          onClick={() => {
            setView("local");
            setSearchTrigger(prev => prev + 1);
          }}
          disabled={!postcode.trim()}
        >
          📍 Local
        </button>

        <button
          className={view === "saved" ? "active" : ""}
          onClick={() => setView("saved")}
        >
          ⭐ Saved ({savedJobs.length})
        </button>
      </div>

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

        
        <div className="commute-controls">
          <label>Travel mode:</label>
          <select value={travelMode} onChange={(e) => setTravelMode(e.target.value)}>
            <option value="driving">🚗 Car</option>
            <option value="walking">🚶 Walk</option>
            <option value="bicycling">🚴 Bike</option>
            <option value="transit">🚆 Transit</option>
          </select>
        </div>

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
          disabled={view === "remote"}
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

        
        <select
          value={salaryMin}
          onChange={(e) => {
            setSalaryMin(e.target.value);
            setSearchTrigger(prev => prev + 1);
          }}
        >
          <option value="">Min Salary</option>
          <option value="20000">£20,000</option>
          <option value="30000">£30,000</option>
          <option value="40000">£40,000</option>
          <option value="50000">£50,000</option>
          <option value="60000">£60,000+</option>
        </select>

        <select
          value={salaryMax}
          onChange={(e) => {
            setSalaryMax(e.target.value);
            setSearchTrigger(prev => prev + 1);
          }}
        >
          <option value="">Max Salary</option>
          <option value="30000">£30,000</option>
          <option value="40000">£40,000</option>
          <option value="50000">£50,000</option>
          <option value="70000">£70,000</option>
          <option value="100000">£100,000</option>
        </select>
      
      </div>

      <div className="info-hint">
        <p>
          💡 Tip: Add a postcode to see nearby jobs, or browse remote roles. Save jobs to track them later.
        </p>
      </div>

      <Banner
        loading={loading}
        text={
          !hasSearched && !view
            ? "Start by entering a keyword or postcode to find jobs"
            : loading
            ? `Searching for ${buildSearchSummary() || "remote jobs" }...`
            : `Showing results for ${buildSearchSummary() || " jobs"}`
        }
      />

      

      {/* ERROR + HELP */}
      {error && <p className="error-text">{error}</p>}

      

      
      {/* RESULTS */}
      {hasSearched && (
        <div>
          {/* LOCAL */}
          {view === "local" && (
            <>
              <h2>Jobs Near You</h2>

              {usedRadius > radius && (
                <p className="helper-text">
                  Showing jobs within {usedRadius} miles (expanded from {radius} miles)
                </p>
              )}

              {localJobs.length === 0 && !loading && (
                <p>No local jobs found.</p>
              )}

              <ul>
                {sortedLocalJobs.map((job) => {
                  const jobKey = String(job.id);
                  const match = getMatchDetails(job);
                  
                  console.log("JOB CARD RENDER:", job.id, commuteTimes[job.id]);
                  
                  return (
                    <JobCard
                      key={job.id || `remotive-${job.redirect_url}`}
                      job={job}
                      match={match}
                      onSave={toggleSaveJob}
                      isSaved={isSaved(job)}
                      showDistance={true}
                      onFetchCommute={() => fetchCommuteForJob(job)}
                      commuteTime={commuteTimes[jobKey]}
                      travelMode={travelMode}
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
      )}
    </div>
  );
}