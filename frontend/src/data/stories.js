export const CATEGORIES = ["All", "Frontend", "Backend", "Architecture"];

export const STORIES = [
  {
    id: 1,
    category: "Architecture",
    title: "Core Concept: The Auth Flow",
    description:
      "Understand how JWT tokens are generated, validated, and refreshed across our microservices.",
    readTime: "12 min read",
    status: "in-progress",
    progress: 45,
  },
  {
    id: 2,
    category: "Frontend",
    title: "State Management Strategy",
    description:
      "A deep dive into how we handle global state using Context and reducers to minimize re-renders.",
    readTime: "8 min read",
    status: "not-started",
    progress: 0,
  },
  {
    id: 3,
    category: "Backend",
    title: "Database Indexing Practices",
    description:
      "Review our guidelines for creating composite indexes to optimize read-heavy queries.",
    readTime: null,
    status: "completed",
    progress: 100,
  },
];
