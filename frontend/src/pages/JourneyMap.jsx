import React from "react";
import { Link, useParams } from "react-router";
import {
  HiArrowLeft,
  HiOutlineClock,
  HiOutlineMap,
} from "react-icons/hi";
import { HiListBullet } from "react-icons/hi2";
import ChapterCard from "../components/ChapterCard";
import { AUTH_JOURNEY } from "../data/journeys";

export default function JourneyMap() {
  const { journeyId } = useParams();
  const journey = AUTH_JOURNEY;

  return (
    <div className="bg-background-light text-text-main h-screen flex flex-col overflow-hidden antialiased">
      {/* ─── Minimal header ─────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-6 bg-background-light border-b border-gray-200 z-10 flex-shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2 text-text-main hover:text-primary transition-colors group"
        >
          <HiArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium tracking-wide uppercase">
            Back to Library
          </span>
        </Link>
      </header>

      {/* ─── Split layout ───────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left pane — story meta (hidden on mobile) */}
        <aside className="hidden lg:flex w-2/5 p-16 flex-col justify-center border-r border-gray-200 bg-background-light z-0">
          <div className="max-w-md mx-auto">
            {/* Category pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <HiOutlineMap className="text-base" />
              {journey.category} Tour
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight mb-6 text-text-main">
              {journey.title}
            </h1>

            {/* Description */}
            <p className="font-display text-xl text-muted leading-relaxed mb-10">
              {journey.description}
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-full bg-cover bg-center shadow-sm"
                style={{
                  backgroundImage: `url('${journey.author.avatar}')`,
                }}
                aria-label={journey.author.name}
              />
              <div>
                <p className="text-base font-semibold text-text-main">
                  {journey.author.name}
                </p>
                <p className="text-sm text-muted flex items-center gap-1">
                  <HiOutlineClock className="text-sm" />
                  {journey.estimatedTime}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right pane — timeline (scrollable) */}
        <section className="w-full lg:w-3/5 overflow-y-auto p-8 lg:p-16 bg-white relative">
          <div className="max-w-2xl mx-auto">
            {/* Section heading */}
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted mb-12 flex items-center gap-2">
              <HiListBullet className="text-xl" />
              Journey Chapters
            </h2>

            {/* Timeline */}
            <div className="relative">
              {journey.chapters.map((chapter, idx) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  isLast={idx === journey.chapters.length - 1}
                  journeyId={journeyId}
                  chapterIndex={idx + 1}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
