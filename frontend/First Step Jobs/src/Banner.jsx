// Banner.jsx
export default function Banner({ loading, text }) {
  return (
    <div className={`banner ${loading ? "loading" : ""}`}>
      <p>{loading ? `🔍 ${text}` : `🎯 ${text}`}</p>
    </div>
  );
}