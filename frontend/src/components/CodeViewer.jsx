import React, { useEffect, useRef } from "react";
import { HiOutlineDocumentText } from "react-icons/hi";

/* Color mapping for syntax tokens */
const tokenColor = {
  import: "text-purple-400",
  keyword: "text-purple-400",
  async: "text-blue-400",
  control: "text-blue-400",
  string: "text-green-300",
  number: "text-orange-400",
  comment: "text-slate-500 italic",
  code: "text-slate-300",
  blank: "",
};

/* Syntax-colour a single line of code */
function colorize(text, type) {
  if (type === "blank") return "\u00A0";
  if (type === "comment") return <span className={tokenColor.comment}>{text}</span>;

  // Simple regex-based colouring
  const parts = [];
  let remaining = text;
  let key = 0;

  const patterns = [
    { regex: /(import|export|const|return|from)\b/g, cls: tokenColor.import },
    { regex: /(async|await|if|try|catch|else)\b/g, cls: tokenColor.async },
    { regex: /('[^']*')/g, cls: tokenColor.string },
    { regex: /(\b\d+\b)/g, cls: tokenColor.number },
    { regex: /(\/\/.*$)/g, cls: tokenColor.comment },
    { regex: /(true|false|null|undefined)\b/g, cls: tokenColor.number },
  ];

  // Build a merged token list
  const tokens = [];
  for (const { regex, cls } of patterns) {
    let m;
    regex.lastIndex = 0;
    while ((m = regex.exec(text)) !== null) {
      tokens.push({ start: m.index, end: m.index + m[0].length, cls, text: m[0] });
    }
  }

  // Sort by position and deduplicate overlapping
  tokens.sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const t of tokens) {
    if (t.start < cursor) continue;
    if (t.start > cursor) {
      parts.push(<span key={key++}>{remaining.slice(cursor, t.start)}</span>);
    }
    parts.push(
      <span key={key++} className={t.cls}>
        {t.text}
      </span>
    );
    cursor = t.end;
  }
  if (cursor < remaining.length) {
    parts.push(<span key={key++}>{remaining.slice(cursor)}</span>);
  }

  return parts.length ? parts : text;
}

export default function CodeViewer({ fileName, code, activeLines = [] }) {
  const scrollContainerRef = useRef(null);
  const lineRefs = useRef([]);

  useEffect(() => {
    // Find the first active line to scroll into view
    const firstActiveIndex = activeLines.length > 0 ? activeLines[0] : -1;
    
    if (firstActiveIndex !== -1 && lineRefs.current[firstActiveIndex] && scrollContainerRef.current) {
      const lineElement = lineRefs.current[firstActiveIndex];
      const container = scrollContainerRef.current;
      
      const offset = lineElement.offsetTop - container.offsetTop - 60;
      
      container.scrollTo({
        top: Math.max(0, offset),
        behavior: "smooth"
      });
    }
  }, [activeLines]);

  const lines = code ? code.split('\n') : [];

  return (
    <div className="w-1/2 h-full bg-background-dark relative border-l border-slate-800 shadow-2xl flex flex-col hidden lg:flex">
      {/* macOS-style window chrome */}
      <div className="h-12 bg-[#1a100c] border-b border-slate-800 flex items-center px-4 justify-between select-none flex-shrink-0">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs bg-[#2a1b15] px-3 py-1 rounded-md border border-slate-700/50">
          <HiOutlineDocumentText className="text-sm" />
          {fileName}
        </div>
        <div className="w-16" />
      </div>

      {/* Code */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed text-slate-300"
      >
        <pre>
          <code>
            {lines.map((text, i) => {
              // Just pass 'code' type for basic coloring since we simplified
              const inner = colorize(text, "code");
              // Check if i+1 is in activeLines (since LLM will likely give 1-indexed lines)
              const isActive = activeLines.includes(i + 1);

              return (
                <div
                  key={i}
                  ref={(el) => (lineRefs.current[i + 1] = el)}
                  className={`relative -mx-6 px-6 py-0.5 border-l-4 transition-colors duration-300 ${
                    isActive
                      ? "bg-primary/10 border-primary"
                      : "border-transparent hover:bg-white/5"
                  }`}
                >
                  {inner}
                  {"\n"}
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Mini scrollbar indicator */}
      <div className="absolute right-4 top-16 bottom-16 w-2 bg-slate-800/50 rounded-full overflow-hidden">
        <div className="absolute top-[35%] w-full h-12 bg-primary/40 rounded-full" />
      </div>
    </div>
  );
}
