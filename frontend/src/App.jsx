import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Library from "./pages/Library";
import JourneyMap from "./pages/JourneyMap";
import StoryView from "./pages/StoryView";
import { JourneyProvider } from "./context/JourneyContext";

export default function App() {
  return (
    <JourneyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/journey/:journeyId" element={<JourneyMap />} />
          <Route path="/journey/:journeyId/chapter/:chapterIndex" element={<StoryView />} />
        </Routes>
      </BrowserRouter>
    </JourneyProvider>
  );
}
