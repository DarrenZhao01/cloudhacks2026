import React from "react";

const CATEGORIES = ["All", "Frontend", "Backend", "Architecture"];

export default function FilterPills({ active, onChange }) {
  return (
    <div className="flex gap-3 mb-10 flex-wrap overflow-x-auto p-2 -m-2 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={[
            "flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6",
            "transition-colors cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-light",
            active === cat
              ? "bg-primary text-white"
              : "bg-surface text-text-main hover:bg-muted/20",
          ].join(" ")}
        >
          <span className="text-sm font-bold tracking-wide uppercase leading-normal font-sans">
            {cat}
          </span>
        </button>
      ))}
    </div>
  );
}
