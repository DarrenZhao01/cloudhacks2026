import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Library from "./pages/Library";
import JourneyMap from "./pages/JourneyMap";
import StoryView from "./pages/StoryView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/journey/:journeyId" element={<JourneyMap />} />
        <Route path="/journey/:journeyId/chapter/:chapterIndex" element={<StoryView />} />
      </Routes>
    </BrowserRouter>
  );
}
