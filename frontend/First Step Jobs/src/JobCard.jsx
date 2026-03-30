export default function JobCard({
  job,
  match,
  onSave,
  onRemove,
  isSaved,
  showDistance = true
}) {
  return (
    <li className="job-card">
      <a
        href={job.redirect_url}
        target="_blank"
        rel="noopener noreferrer"
        className="job-header"
      >
        <h3>{job.title}</h3>
        <p className="job-meta">
          {job.company?.display_name} — {job.location?.display_name}
        </p>
      </a>

      <div className="match-score">
        ⭐ {match.score}% Match
      </div>

      <ul className="match-reasons">
        {match.reasons.map((reason, i) => {
          const bad =
            reason.includes("Far") || reason.includes("Outside");

          return (
            <li key={i} className={bad ? "warn" : "ok"}>
              {bad ? "⚠" : "✔"} {reason}
            </li>
          );
        })}
      </ul>

      <div className="job-details">
        <p>
          💰 £{job.salary_min ?? "N/A"} - £{job.salary_max ?? "N/A"}
        </p>

        {showDistance && job.distance && (
          <p>
            📍 {(job.distance * 0.621371).toFixed(1)} miles away
          </p>
        )}

        {job.created && (
          <p>
            🕒 {new Date(job.created).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="job-actions">
        {!onRemove && (
          <button
            className="save-btn"
            onClick={() => onSave(job)}
          >
            {isSaved ? "★ Saved" : "☆ Save"}
          </button>
        )}

        {onRemove && (
          <button
            className="remove-btn"
            onClick={() => onRemove(job)}
          >
            🗑 Remove
          </button>
        )}
      </div>
    </li>
  );
}