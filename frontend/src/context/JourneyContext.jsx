import React, { createContext, useContext, useState } from "react";

const JourneyContext = createContext();

export function JourneyProvider({ children }) {
  const [dynamicStories, setDynamicStories] = useState([]);
  const [dynamicJourneys, setDynamicJourneys] = useState({});
  const [dynamicChapters, setDynamicChapters] = useState({});

  const setDynamicData = (stories, journeys, chapters) => {
    setDynamicStories(stories);
    setDynamicJourneys(journeys);
    setDynamicChapters(chapters);
  };

  return (
    <JourneyContext.Provider
      value={{
        dynamicStories,
        dynamicJourneys,
        dynamicChapters,
        setDynamicData,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourneyData() {
  return useContext(JourneyContext);
}
