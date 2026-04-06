import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ metadata, onPageChange }) {
  if (!metadata || metadata.total_pages <= 1) return null;

  const { current_page, total_pages } = metadata;

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    
    if (total_pages <= showPages) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      if (current_page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(total_pages);
      } else if (current_page >= total_pages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = total_pages - 3; i <= total_pages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = current_page - 1; i <= current_page + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(total_pages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-4">
      <button
        onClick={() => onPageChange(current_page - 1)}
        disabled={current_page === 1}
        className="p-2 rounded-lg border border-[var(--border-line)] hover:border-orange-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--border-line)] transition-all"
        style={{ background: "var(--bg-card)", color: "var(--text-main)" }}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-3 py-2 text-sm"
              style={{ color: "var(--text-sub)" }}
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                current_page === page
                  ? "bg-orange-500 text-white"
                  : "border border-[var(--border-line)] hover:border-orange-400"
              }`}
              style={
                current_page !== page
                  ? { background: "var(--bg-card)", color: "var(--text-main)" }
                  : {}
              }
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(current_page + 1)}
        disabled={current_page === total_pages}
        className="p-2 rounded-lg border border-[var(--border-line)] hover:border-orange-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--border-line)] transition-all"
        style={{ background: "var(--bg-card)", color: "var(--text-main)" }}
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
