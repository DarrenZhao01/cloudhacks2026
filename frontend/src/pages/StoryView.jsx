import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import {
  HiArrowLeft,
  HiOutlineBookmark,
  HiCheck,
  HiArrowRight,
} from "react-icons/hi";
import CodeViewer from "../components/CodeViewer";
import { AUTH_CHAPTER_1 } from "../data/chapters";

export default function StoryView() {
  const { journeyId, chapterIndex } = useParams();
  const chapter = AUTH_CHAPTER_1; // Static for now

  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef([]);
  const narrativeRef = useRef(null);

  /* Track which narrative section is in view */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target);
            if (idx !== -1) setActiveSection(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.1 }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background-light text-slate-800 font-display flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 z-50">
        <div
          className="h-full bg-primary rounded-r-full transition-all duration-700 ease-out"
          style={{ width: `${chapter.progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-1 left-0 w-full lg:w-1/2 flex items-center justify-between px-6 md:px-10 py-4 bg-background-light/95 backdrop-blur-sm z-40 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Link
            to={`/journey/${journeyId || "auth-flow"}`}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
          >
            <HiArrowLeft className="text-xl text-slate-500 group-hover:text-primary transition-colors" />
          </Link>
          <div>
            <p className="text-sm text-slate-500 font-sans tracking-wide uppercase font-medium">
              Chapter {chapter.chapterNumber}
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              {chapter.chapterTitle}
            </h1>
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors">
          <HiOutlineBookmark className="text-xl" />
          <span className="hidden sm:inline">Save Progress</span>
        </button>
      </header>

      {/* Main split layout */}
      <main className="flex h-screen pt-[76px] w-full max-w-[1920px] mx-auto">
        {/* Left pane — narrative (scrollable) */}
        <div
          ref={narrativeRef}
          className="w-full lg:w-1/2 h-full overflow-y-auto narrative-scroll relative pb-32"
        >
          <div className="max-w-2xl mx-auto px-6 md:px-12 py-16">
            {/* Story header */}
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-6">
                {chapter.storyTitle}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                {chapter.storyIntro}
              </p>
            </div>

            {/* Narrative sections */}
            {chapter.sections.map((section, idx) => (
              <div
                key={section.id}
                id={section.id}
                ref={(el) => (sectionRefs.current[idx] = el)}
                className={`mb-24 transition-opacity duration-500 ${
                  idx === activeSection ? "opacity-100" : "opacity-40 hover:opacity-100"
                }`}
              >
                <h3 className="text-2xl font-bold text-slate-800 mb-4">
                  {section.heading}
                </h3>
                {section.paragraphs.map((p, pi) => (
                  <p key={pi} className="text-lg leading-[1.8] text-slate-700 mb-6">
                    {p.text}{" "}
                    {p.codeRef && (
                      <code
                        className={`font-mono text-sm px-2 py-1 rounded-md border border-slate-200 ${
                          p.codeRefHighlight
                            ? "bg-slate-100 text-primary cursor-pointer hover:bg-primary/10 transition-colors"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.codeRef}
                      </code>
                    )}{" "}
                    {p.suffix || ""}
                  </p>
                ))}
              </div>
            ))}

            {/* Chapter complete marker */}
            <div className="mt-32 pt-16 border-t border-slate-200 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiCheck className="text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Chapter Complete</h3>
              <p className="text-slate-600 mb-8">
                You've successfully traced the authentication flow.
              </p>
            </div>
          </div>

          {/* Floating next chapter CTA */}
          <div className="sticky bottom-8 left-0 right-0 px-6 md:px-12 flex justify-center">
            <button className="bg-primary hover:bg-[#d5582a] text-white font-sans font-medium px-8 py-4 rounded-full shadow-[0_8px_24px_rgba(238,98,47,0.3)] transform transition-all hover:-translate-y-1 flex items-center gap-3 text-base">
              Continue to Chapter {chapter.nextChapter.number}:{" "}
              {chapter.nextChapter.title}
              <HiArrowRight className="text-lg" />
            </button>
          </div>
        </div>

        {/* Right pane — code viewer (sticky) */}
        <CodeViewer fileName={chapter.codeFile} lines={chapter.codeLines} />
      </main>
    </div>
  );
}
