import React from "react";

export default function JobCard({
  job,
  match,
  onSave,
  isSaved,
  showDistance = true,
}) {
  return (
    <div className="job-card">
      
      {/* Title */}
      <a
        className="job-title"
        href={job.redirect_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <h3>{job.title}</h3>
      </a>

      {/* Company + Location */}
      <p className="job-meta">
        {job.company?.display_name} • {job.location?.display_name}
      </p>

      {/* Match score (optional) */}
      {match && (
        <p className="match-score">
          ⭐ Match: {match.score}%
        </p>
      )}

      {/* Match reasons */}
      {match?.reasons?.length > 0 && (
        <ul className="match-reasons">
          {match.reasons.map((reason, i) => {
            const isWarning =
              reason.includes("Far") || reason.includes("Outside");

            return (
              <li key={i} className={isWarning ? "warn" : "ok"}>
                {isWarning ? "⚠" : "✔"} {reason}
              </li>
            );
          })}
        </ul>
      )}

      {/* Salary */}
      <p className="job-details">
        💰 £{job.salary_min ?? "N/A"} - £{job.salary_max ?? "N/A"}
      </p>

      {/* Distance (only for local jobs) */}
      {showDistance && job.distance && (
        <p className="job-details">
          📍 {(job.distance * 0.621371).toFixed(1)} miles away
        </p>
      )}

      {/* Date */}
      {job.created && (
        <p className="job-details">
          🕒 Posted: {new Date(job.created).toLocaleDateString()}
        </p>
      )}

      {/* Save button */}
      {onSave && (
        <button className="save-btn" onClick={() => onSave(job)}>
          {isSaved ? "★ Saved" : "☆ Save"}
        </button>
      )}
    </div>
  );
}