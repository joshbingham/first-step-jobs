export default function JobCard({ job, match, onSave, onRemove, isSaved, showDistance = true }) {
  return (
    <li className="job-card">
      <a href={job.redirect_url} target="_blank" rel="noopener noreferrer">
        <h3>{job.title}</h3>
        <p>{job.company?.display_name} — {job.location?.display_name}</p>
      </a>

      <p>⭐ Match: {match.score}%</p>
      <ul className="match-reasons">
        {match.reasons.map((reason, i) => (
          <li
            key={i}
            className={reason.includes("Far") || reason.includes("Outside") ? "warning" : "ok"}
          >
            {reason.includes("Far") || reason.includes("Outside") ? "⚠" : "✔"} {reason}
          </li>
        ))}
      </ul>

      <p>
        £{job.salary_min ?? "N/A"} - £{job.salary_max ?? "N/A"}
      </p>

      {showDistance && job.distance && (
        <p>{(job.distance * 0.621371).toFixed(1)} miles away</p>
      )}

      {job.created && (
        <p>Posted: {new Date(job.created).toLocaleDateString()}</p>
      )}

      <div className="job-actions">
        {!onRemove && (
          <button onClick={() => onSave(job)}>
            {isSaved ? "★ Saved" : "☆ Save"}
          </button>
        )}

        {onRemove && (
          <button className="remove-btn" onClick={() => onRemove(job)}>
            🗑 Remove
          </button>
        )}
      </div>
    </li>
  );
}