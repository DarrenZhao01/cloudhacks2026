import React, { useState } from "react";
import Navbar from "../components/Navbar";
import FilterPills from "../components/FilterPills";
import StoryCard from "../components/StoryCard";
import { useJourneyData } from "../context/JourneyContext";
import { STORIES } from "../data/stories";

export default function Library() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { dynamicStories, setDynamicData } = useJourneyData();

  const handleGenerate = async () => {
    if (!githubUrl) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: githubUrl }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setDynamicData(data.stories, data.journeys, data.chapters);
        setGithubUrl("");
      } else {
        console.error("Error generating UI:", data.error);
        alert("Generation failed. Check console.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStories =
    activeFilter === "All"
      ? dynamicStories
      : dynamicStories.filter((s) => s.category === activeFilter);

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
                    Welcome, Darren.
                  </h1>
                  <p className="text-muted text-lg font-medium leading-normal font-sans">
                    Pick a story to begin your journey, or generate a new one from a GitHub URL.
                  </p>
                </div>
              </div>

              {/* URL Generation Input */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={loading}
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading || !githubUrl}
                  className="bg-primary hover:bg-[#d5582a] text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center min-w-[200px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Repo...
                    </div>
                  ) : (
                    "Generate Story"
                  )}
                </button>
              </div>

              <FilterPills active={activeFilter} onChange={setActiveFilter} />

              {/* Story card grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {filteredStories.map((story) => (
                  <StoryCard key={story.id} story={{
                    ...story,
                    link: story.link || (story.journeys && story.journeys.length > 0 ? `/journey/${story.journeys[0]}` : `/journey/${story.id}`),
                    status: story.status || "not-started",
                    progress: story.progress || 0
                  }} />
                ))}

                {filteredStories.length === 0 && !loading && (
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
                      Enter a GitHub repository URL above and click Generate Story to begin your
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
