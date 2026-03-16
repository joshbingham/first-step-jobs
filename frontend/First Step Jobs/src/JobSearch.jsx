import React, { useState } from "react";

function JobSearch() {
  const [jobs, setJobs] = useState([]);

  const handleSearch = async () => {
    // This will call your backend API later
    const response = await fetch("http://localhost:5000/jobs");
    const data = await response.json();
    setJobs(data);
  };

  return (
    <div>
      <button onClick={handleSearch}>Load Jobs</button>
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>{job.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default JobSearch;