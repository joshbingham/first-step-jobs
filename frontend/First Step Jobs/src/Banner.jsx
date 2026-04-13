// Banner.jsx
export default function Banner({ loading, text }) {
  return (
    <div className={`banner ${loading ? "loading" : ""}`}>
      <p>
        {text}
        {loading && <span className="spinner" />}
      </p>
    </div>
  );
}