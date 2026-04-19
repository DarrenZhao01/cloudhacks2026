import React from "react";
import { Link } from "react-router";
import {
  HiCheck,
  HiPlay,
  HiLockClosed,
  HiArrowRight,
  HiOutlineRefresh,
} from "react-icons/hi";

/* ── Node icon on the vertical timeline ─────────────────────── */
function TimelineNode({ status }) {
  if (status === "completed") {
    return (
      <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center ring-4 ring-white shadow-sm">
        <HiCheck className="text-lg" />
      </div>
    );
  }

  if (status === "current") {
    return (
      <>
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-white shadow-md">
          <HiPlay className="text-lg" />
        </div>
        {/* Ping animation */}
        <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-ping" />
      </>
    );
  }

  // locked
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 text-gray-400 flex items-center justify-center ring-4 ring-white">
      <HiLockClosed className="text-sm" />
    </div>
  );
}

/* ── Single chapter card ────────────────────────────────────── */
export default function ChapterCard({ chapter, isLast, journeyId, chapterIndex }) {
  const { status, title, description } = chapter;
  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  const isLocked = status === "locked";

  /* Status label */
  const statusLabel = isCompleted
    ? "Completed"
    : isCurrent
    ? "Up Next"
    : "Locked";

  const statusColor = isCompleted
    ? "text-success"
    : isCurrent
    ? "text-primary"
    : "text-gray-500";

  return (
    <div
      className={[
        "relative flex gap-8",
        !isLast ? "mb-12" : "",
        isLocked ? "opacity-50 cursor-not-allowed group" : "group",
      ].join(" ")}
    >
      {/* Vertical line segment */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200 -ml-px -z-0" />
      )}

      {/* Timeline node */}
      <div className="flex-shrink-0 relative z-10">
        <TimelineNode status={status} />
      </div>

      {/* Card body */}
      <div
        className={[
          "flex-1 rounded-xl p-6 relative overflow-hidden",
          isCompleted
            ? "bg-white border border-gray-100 shadow-soft opacity-75 transition-opacity hover:opacity-100"
            : "",
          isCurrent
            ? "bg-white border-2 border-primary/20 shadow-lg transition-transform hover:-translate-y-1"
            : "",
          isLocked
            ? "border border-gray-200 bg-gray-50/50"
            : "",
        ].join(" ")}
      >
        {/* Locked frosted overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10" />
        )}

        <div className={isLocked ? "relative z-0" : ""}>
          <span
            className={`text-xs font-bold uppercase tracking-wider mb-2 block ${statusColor}`}
          >
            {statusLabel}
          </span>

          <h3
            className={`font-display text-2xl font-bold mb-2 ${
              isLocked ? "text-gray-700" : "text-text-main"
            }`}
          >
            {title}
          </h3>

          <p
            className={`text-sm leading-relaxed ${
              isLocked ? "text-gray-500" : "text-muted"
            }`}
          >
            {description}
          </p>

          {/* Completed → review button */}
          {isCompleted && (
            <Link
              to={`/journey/${journeyId}/chapter/${chapterIndex}`}
              className="mt-4 text-sm font-medium text-text-main hover:text-success flex items-center gap-1 transition-colors cursor-pointer"
            >
              <HiOutlineRefresh className="text-base" />
              Review Chapter
            </Link>
          )}

          {/* Current → start CTA */}
          {isCurrent && (
            <Link
              to={`/journey/${journeyId}/chapter/${chapterIndex}`}
              className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors shadow-sm w-full sm:w-auto gap-2"
            >
              Start Chapter
              <HiArrowRight className="text-base" />
            </Link>
          )}
        </div>

        {/* Locked tooltip */}
        {isLocked && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-text-main text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
            Complete previous chapter to unlock
          </div>
        )}
      </div>
    </div>
  );
}
