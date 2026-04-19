import React from "react";
import {
  HiOutlineClock,
  HiCheckCircle,
} from "react-icons/hi";

function ProgressBar({ status, progress }) {
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  const labelColor = isCompleted
    ? "text-success"
    : isInProgress
    ? "text-primary"
    : "text-muted";

  const barColor = isCompleted ? "bg-success" : "bg-primary";

  const label = isCompleted
    ? "Done"
    : isInProgress
    ? "In Progress"
    : "Not Started";

  const displayPercent = isCompleted ? 100 : progress;

  return (
    <div className="mt-auto pt-4 border-t border-muted/20">
      <div className="flex justify-between items-center mb-2">
        <span
          className={`text-xs font-bold uppercase tracking-wide font-sans ${labelColor}`}
        >
          {label}
        </span>
        <span
          className={`text-xs font-bold font-sans ${labelColor}`}
        >
          {displayPercent}%
        </span>
      </div>
      <div className="w-full bg-muted/20 rounded-full h-1.5 overflow-hidden">
        <div
          className={`${barColor} h-1.5 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function StoryCard({ story }) {
  const isCompleted = story.status === "completed";

  return (
    <a
      href="#"
      className={[
        "group flex flex-col bg-surface rounded-xl p-6",
        "shadow-soft hover:shadow-soft-hover",
        "transition-all duration-300 hover:-translate-y-1",
        "border border-transparent hover:border-primary/20",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background-light",
        isCompleted ? "opacity-80 hover:opacity-100" : "",
      ].join(" ")}
    >
      {/* Top meta row */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center rounded-md bg-muted/10 px-2 py-1 text-xs font-semibold text-muted uppercase tracking-wider font-sans">
          {story.category}
        </span>

        <span className="flex items-center text-sm text-muted font-sans font-medium gap-1">
          {isCompleted ? (
            <>
              <HiCheckCircle className="text-base" />
              Completed
            </>
          ) : (
            <>
              <HiOutlineClock className="text-base" />
              {story.readTime}
            </>
          )}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-text-main leading-snug mb-3 font-display group-hover:text-primary transition-colors">
        {story.title}
      </h3>

      {/* Description */}
      <p className="text-muted text-base line-clamp-2 mb-6 font-sans">
        {story.description}
      </p>

      {/* Progress */}
      <ProgressBar status={story.status} progress={story.progress} />
    </a>
  );
}
