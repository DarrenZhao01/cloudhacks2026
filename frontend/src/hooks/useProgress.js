import { useState, useCallback } from "react";

const STORAGE_KEY = "narrative_journey_progress";

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * useProgress – lightweight hook around localStorage.
 *
 * Shape of stored data:
 *   { "auth-flow": { completedChapters: [1, 2] } }
 *
 * Usage:
 *   const { isChapterComplete, markChapterComplete } = useProgress(journeyId);
 */
export default function useProgress(journeyId) {
  const [progress, setProgress] = useState(loadProgress);

  const isChapterComplete = useCallback(
    (chapterIndex) => {
      const journey = progress[journeyId];
      return journey?.completedChapters?.includes(chapterIndex) ?? false;
    },
    [progress, journeyId]
  );

  const markChapterComplete = useCallback(
    (chapterIndex) => {
      setProgress((prev) => {
        const journey = prev[journeyId] || { completedChapters: [] };
        if (journey.completedChapters.includes(chapterIndex)) return prev;

        const next = {
          ...prev,
          [journeyId]: {
            ...journey,
            completedChapters: [...journey.completedChapters, chapterIndex],
          },
        };
        saveProgress(next);
        return next;
      });
    },
    [journeyId]
  );

  return { isChapterComplete, markChapterComplete };
}
