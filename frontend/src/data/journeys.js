export const AUTH_JOURNEY = {
  id: "auth-flow",
  category: "Architecture",
  categoryIcon: "map",
  title: "The Authentication Flow",
  description:
    "Understand how user requests are verified, tokens are minted, and sessions are maintained across our microservices. A foundational journey for all backend engineers.",
  author: {
    name: "Jane Doe",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDc64Y5zP7OlUzesm3aVxK2PKhB6VKsK197GLwP08Rv8qH_Pwp56McCwe_yK0onN0R4IHh9-RJ_Mtzve6fXaGutWcgYKmlM6rAXnPFk_95w1lPoVIHBQ7Q18AE55e7HfLCF8bk-TqhQRg3ex2IJlaAV7z6jCZupt_pAfMk07GQwhgEr_2YCQ4jlYB0BT1K3tqeM40MTzEZ0jDHBB9vgMQxIibcRqTTwI6Q_KOs42TanZ0rypNg2zzuMhGjQFzNM6-v6DtESKMFZT98",
  },
  estimatedTime: "45 min estimated journey",
  chapters: [
    {
      id: 1,
      title: "The Entry Point",
      description:
        "Where the request first hits the API gateway and initial headers are evaluated before reaching the auth service.",
      status: "completed",
    },
    {
      id: 2,
      title: "Token Minting",
      description:
        "Deep dive into the JWT generation, understanding the payload structure, and the cryptographic signing process.",
      status: "current",
    },
    {
      id: 3,
      title: "Session Management",
      description:
        "How Redis caches the user state, handles concurrent logins, and manages token revocation.",
      status: "locked",
    },
    {
      id: 4,
      title: "Refresh Mechanics",
      description:
        "The quiet background process of keeping a user logged in without interrupting their experience.",
      status: "locked",
    },
  ],
};
