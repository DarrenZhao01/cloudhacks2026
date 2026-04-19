import React, { useState } from "react";
import Navbar from "../components/Navbar";
import FilterPills from "../components/FilterPills";
import StoryCard from "../components/StoryCard";
import { STORIES } from "../data/stories";

export default function Library() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredStories =
    activeFilter === "All"
      ? STORIES
      : STORIES.filter((s) => s.category === activeFilter);

  return (
    <div className="bg-background-light text-text-main min-h-screen antialiased">
      <div className="relative flex h-auto w-full flex-col overflow-x-hidden">
        <div className="flex h-full grow flex-col">
          <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
            <div className="flex flex-col w-full max-w-[1200px] flex-1">
              <Navbar />

              {/* Welcome header */}
              <div className="flex flex-wrap justify-between gap-3 mb-8">
                <div className="flex min-w-72 flex-col gap-2">
                  <h1 className="text-text-main text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] font-display">
                    Welcome, Alex.
                  </h1>
                  <p className="text-muted text-lg font-medium leading-normal font-sans">
                    Pick a story to begin your journey.
                  </p>
                </div>
              </div>

              <FilterPills active={activeFilter} onChange={setActiveFilter} />

              {/* Story card grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {filteredStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}

                {filteredStories.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="size-16 rounded-full bg-surface flex items-center justify-center text-muted mb-6">
                      <svg
                        className="size-8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.466.89 6.042 2.346M12 6.042a8.967 8.967 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.331 0-4.466.89-6.042 2.346M12 6.042V20.346"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-text-main font-display mb-2">
                      No stories available
                    </h3>
                    <p className="text-muted font-sans text-lg max-w-md">
                      Ask your manager to assign a journey to begin your
                      codebase onboarding.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
