// Shared loading indicator — the animated robot (SMIL SVG in /public/loading.svg).
export default function Loading({ text = "Loading..." }) {
  return (
    <div className="loading">
      <img
        src="/loading.svg"
        alt=""
        style={{ width: 160, maxWidth: "60%", display: "block", margin: "0 auto 4px" }}
      />
      <div>{text}</div>
    </div>
  );
}
