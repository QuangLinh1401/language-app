// Shared Prev/Next pagination row (hidden when everything fits on one page).
export default function Pager({ page, pageCount, onPage }) {
  if (pageCount <= 1) return null;
  return (
    <div className="pager-row">
      <button className="pill" disabled={page === 0} onClick={() => onPage(page - 1)}>‹ Prev</button>
      <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700 }}>
        Page {page + 1}/{pageCount}
      </span>
      <button className="pill" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)}>Next ›</button>
    </div>
  );
}
