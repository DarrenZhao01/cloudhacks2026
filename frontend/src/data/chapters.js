export const AUTH_CHAPTER_1 = {
  chapterNumber: 1,
  chapterTitle: "The Auth Flow",
  storyTitle: "Securing the Gates: How We Handle Authentication",
  storyIntro:
    "Before any user can access their sensitive data, they must pass through our authentication gauntlet. It's a multi-step process designed for maximum security while minimizing friction.",
  sections: [
    {
      id: "section-1",
      heading: "1. The Initial Handshake",
      paragraphs: [
        {
          text: "The journey begins when a user submits their credentials. Our client application sends a standard POST request to the",
          codeRef: "/api/v1/auth/login",
          codeRefHighlight: true,
          suffix: "endpoint.",
        },
        {
          text: "This request lands directly in the",
          codeRef: "AuthController",
          codeRefHighlight: false,
          suffix:
            ". The very first thing we do is validate the incoming payload structure to prevent malformed requests from hitting the database.",
        },
      ],
    },
    {
      id: "section-2",
      heading: "2. Verifying Identity",
      paragraphs: [
        {
          text: "Once the payload is validated, we attempt to find the user in our PostgreSQL database using Prisma. We search by the normalized email address.",
        },
        {
          text: "If the user exists, we use bcrypt to compare the provided password against the hashed password stored in the database. Notice the use of",
          codeRef: "bcrypt.compare()",
          codeRefHighlight: true,
          suffix:
            "– this is a critical security step that happens asynchronously to avoid blocking the event loop.",
        },
      ],
    },
    {
      id: "section-3",
      heading: "3. Generating the Tokens",
      paragraphs: [
        {
          text: "Success! The credentials are valid. Now we need to issue the keys to the kingdom. We use a dual-token strategy: a short-lived Access Token and a long-lived Refresh Token.",
        },
        {
          text: "The",
          codeRef: "generateTokens",
          codeRefHighlight: true,
          suffix:
            "utility creates these JWTs. The access token contains minimal claims (user ID and role) and expires in 15 minutes. The refresh token is securely stored in an HTTP-only cookie.",
        },
      ],
    },
  ],
  codeFile: "auth.controller.ts",
  codeLines: [
    { text: `import { Request, Response } from 'express';`, type: "import" },
    { text: `import bcrypt from 'bcryptjs';`, type: "import" },
    { text: `import prisma from '../lib/prisma';`, type: "import" },
    { text: `import { generateTokens } from '../utils/jwt';`, type: "import" },
    { text: "", type: "blank" },
    {
      text: `export const login = async (req: Request, res: Response) => {`,
      type: "code",
      activeFor: [0]
    },
    { text: `  // 1. Validate incoming payload`, type: "comment", activeFor: [0] },
    { text: `  const { email, password } = req.body;`, type: "code", activeFor: [0] },
    { text: "", type: "blank", activeFor: [0] },
    { text: `  if (!email || !password) {`, type: "code", activeFor: [0] },
    {
      text: `    return res.status(400).json({ error: 'Missing credentials' });`,
      type: "code",
      activeFor: [0]
    },
    { text: `  }`, type: "code", activeFor: [0] },
    { text: "", type: "blank" },
    { text: `  try {`, type: "code", activeFor: [1] },
    { text: `    // 2. Find user in database`, type: "comment", activeFor: [1] },
    { text: `    const user = await prisma.user.findUnique({`, type: "code", activeFor: [1] },
    { text: `      where: { email: email.toLowerCase() }`, type: "code", activeFor: [1] },
    { text: `    });`, type: "code", activeFor: [1] },
    { text: "", type: "blank", activeFor: [1] },
    { text: `    if (!user) {`, type: "code", activeFor: [1] },
    {
      text: `      return res.status(401).json({ error: 'Invalid credentials' });`,
      type: "code",
      activeFor: [1]
    },
    { text: `    }`, type: "code", activeFor: [1] },
    { text: "", type: "blank", activeFor: [1] },
    { text: `    // 3. Verify password hash`, type: "comment", activeFor: [1] },
    {
      text: `    const isValidPassword = await bcrypt.compare(password, user.passwordHash);`,
      type: "code",
      activeFor: [1]
    },
    { text: "", type: "blank", activeFor: [1] },
    {
      text: `    if (!isValidPassword) {`,
      type: "code",
      activeFor: [1]
    },
    {
      text: `      return res.status(401).json({ error: 'Invalid credentials' });`,
      type: "code",
      activeFor: [1]
    },
    { text: `    }`, type: "code", activeFor: [1] },
    { text: "", type: "blank" },
    { text: `    // 4. Generate JWT tokens`, type: "comment", activeFor: [2] },
    {
      text: `    const { accessToken, refreshToken } = generateTokens(user.id, user.role);`,
      type: "code",
      activeFor: [2]
    },
    { text: "", type: "blank", activeFor: [2] },
    { text: `    // 5. Set HTTP-only cookie for refresh token`, type: "comment", activeFor: [2] },
    { text: `    res.cookie('refreshToken', refreshToken, {`, type: "code", activeFor: [2] },
    { text: `      httpOnly: true,`, type: "code", activeFor: [2] },
    {
      text: `      secure: process.env.NODE_ENV === 'production',`,
      type: "code",
      activeFor: [2]
    },
    { text: `      sameSite: 'strict',`, type: "code", activeFor: [2] },
    {
      text: `      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days`,
      type: "code",
      activeFor: [2]
    },
    { text: `    });`, type: "code", activeFor: [2] },
    { text: "", type: "blank", activeFor: [2] },
    { text: `    // 6. Return access token to client`, type: "comment", activeFor: [2] },
    { text: `    return res.status(200).json({`, type: "code", activeFor: [2] },
    { text: `      message: 'Login successful',`, type: "code", activeFor: [2] },
    { text: `      accessToken`, type: "code", activeFor: [2] },
    { text: `    });`, type: "code", activeFor: [2] },
    { text: "", type: "blank" },
    { text: `  } catch (error) {`, type: "code" },
    { text: `    console.error('Login error:', error);`, type: "code" },
    {
      text: `    return res.status(500).json({ error: 'Internal server error' });`,
      type: "code",
    },
    { text: `  }`, type: "code" },
    { text: `};`, type: "code" },
  ],
  nextChapter: {
    number: 2,
    title: "Database Schemas",
  },
  quiz: {
    question: "Before we move on, what handles the token refresh?",
    options: [
      "The API Gateway",
      "The Auth Middleware",
      "The Client Application",
      "The Database"
    ],
    correctOptionIndex: 1,
    successMessage: "Correct! The Auth Middleware intercepts the 401 and requests a new token."
  },
  progress: 35,
};

export const AUTH_CHAPTER_2 = {
  chapterNumber: 2,
  chapterTitle: "Database Schemas",
  storyTitle: "Mapping the Data: How Our Schemas Power the App",
  storyIntro:
    "Every great application needs a solid data foundation. In this chapter, we explore how our Prisma schema defines the relationships between users, sessions, and tokens.",
  sections: [
    {
      id: "section-1",
      heading: "1. The User Model",
      paragraphs: [
        {
          text: "At the heart of our schema is the User model. It stores essential identity fields: email, a bcrypt-hashed password, and a role enum that defaults to",
          codeRef: "USER",
          codeRefHighlight: true,
          suffix: ".",
        },
        {
          text: "Prisma enforces uniqueness on the email field with the",
          codeRef: "@unique",
          codeRefHighlight: false,
          suffix:
            "directive, preventing duplicate accounts at the database level.",
        },
      ],
    },
    {
      id: "section-2",
      heading: "2. Session & Token Relations",
      paragraphs: [
        {
          text: "Each user can have many sessions. We model this as a one-to-many relation using Prisma's relation syntax.",
        },
        {
          text: "The Session model stores the refresh token hash, the device fingerprint, and an",
          codeRef: "expiresAt",
          codeRefHighlight: true,
          suffix:
            "timestamp that our background worker checks to prune stale sessions.",
        },
      ],
    },
    {
      id: "section-3",
      heading: "3. Indexes & Performance",
      paragraphs: [
        {
          text: "We add composite indexes on frequently queried columns. The",
          codeRef: "@@index([userId, expiresAt])",
          codeRefHighlight: true,
          suffix:
            "index lets the session-pruning cron run in sub-millisecond time even at scale.",
        },
        {
          text: "Prisma Migrate generates SQL migrations from these schema changes, giving us version-controlled database evolution.",
        },
      ],
    },
  ],
  codeFile: "schema.prisma",
  codeLines: [
    { text: `// Prisma Schema — schema.prisma`, type: "comment" },
    { text: ``, type: "blank" },
    { text: `generator client {`, type: "code", activeFor: [0] },
    { text: `  provider = "prisma-client-js"`, type: "code", activeFor: [0] },
    { text: `}`, type: "code", activeFor: [0] },
    { text: ``, type: "blank" },
    { text: `datasource db {`, type: "code", activeFor: [0] },
    { text: `  provider = "postgresql"`, type: "code", activeFor: [0] },
    { text: `  url      = env("DATABASE_URL")`, type: "code", activeFor: [0] },
    { text: `}`, type: "code", activeFor: [0] },
    { text: ``, type: "blank" },
    { text: `enum Role {`, type: "code", activeFor: [0] },
    { text: `  USER`, type: "code", activeFor: [0] },
    { text: `  ADMIN`, type: "code", activeFor: [0] },
    { text: `}`, type: "code", activeFor: [0] },
    { text: ``, type: "blank" },
    { text: `model User {`, type: "code", activeFor: [0] },
    { text: `  id           String   @id @default(uuid())`, type: "code", activeFor: [0] },
    { text: `  email        String   @unique`, type: "code", activeFor: [0] },
    { text: `  passwordHash String`, type: "code", activeFor: [0] },
    { text: `  role         Role     @default(USER)`, type: "code", activeFor: [0] },
    { text: `  createdAt    DateTime @default(now())`, type: "code", activeFor: [0] },
    { text: `  sessions     Session[]`, type: "code", activeFor: [1] },
    { text: `}`, type: "code" },
    { text: ``, type: "blank" },
    { text: `model Session {`, type: "code", activeFor: [1] },
    { text: `  id             String   @id @default(uuid())`, type: "code", activeFor: [1] },
    { text: `  userId         String`, type: "code", activeFor: [1] },
    { text: `  user           User     @relation(fields: [userId], references: [id])`, type: "code", activeFor: [1] },
    { text: `  refreshToken   String`, type: "code", activeFor: [1] },
    { text: `  deviceFingerprint String?`, type: "code", activeFor: [1] },
    { text: `  expiresAt      DateTime`, type: "code", activeFor: [1] },
    { text: `  createdAt      DateTime @default(now())`, type: "code", activeFor: [1] },
    { text: ``, type: "blank" },
    { text: `  @@index([userId, expiresAt])`, type: "code", activeFor: [2] },
    { text: `}`, type: "code", activeFor: [2] },
  ],
  nextChapter: {
    number: 3,
    title: "Session Management",
  },
  quiz: {
    question: "Which model handles uniquely identifying standard user accounts?",
    options: [
      "The Session Model",
      "The API Gateway",
      "The User Model",
      "The Role Enum"
    ],
    correctOptionIndex: 2,
    successMessage: "Spot on! The User model stores essential identity fields like email and the password hash."
  },
  progress: 0,
};

export const AUTH_CHAPTER_3 = {
  chapterNumber: 3,
  chapterTitle: "Session Management",
  storyTitle: "Keeping the Lights On: Redis-Powered Sessions",
  storyIntro:
    "Once a user is authenticated, how do we keep them logged in without compromising security? The answer lies in our Redis-backed session layer.",
  sections: [
    {
      id: "section-1",
      heading: "1. The Session Store",
      paragraphs: [
        {
          text: "We initialize a Redis client with connection pooling. The",
          codeRef: "createClient()",
          codeRefHighlight: true,
          suffix:
            "factory reads the REDIS_URL from environment variables and configures sensible defaults for retry logic.",
        },
      ],
    },
    {
      id: "section-2",
      heading: "2. Storing & Retrieving Sessions",
      paragraphs: [
        {
          text: "When a new access token is issued, we store the session metadata in Redis with an expiry matching the refresh token's TTL.",
        },
        {
          text: "Retrieval is a simple",
          codeRef: "GET",
          codeRefHighlight: true,
          suffix:
            "call. If the key is missing, the session has expired and the user must re-authenticate.",
        },
      ],
    },
    {
      id: "section-3",
      heading: "3. Revocation & Logout",
      paragraphs: [
        {
          text: "Logging out calls",
          codeRef: "DEL",
          codeRefHighlight: true,
          suffix:
            "on the session key, immediately invalidating the refresh token. This is why Redis is ideal — O(1) deletion.",
        },
      ],
    },
  ],
  codeFile: "session.service.ts",
  codeLines: [
    { text: `import { createClient } from 'redis';`, type: "import" },
    { text: ``, type: "blank" },
    { text: `const redis = createClient({`, type: "code", activeFor: [0] },
    { text: `  url: process.env.REDIS_URL,`, type: "code", activeFor: [0] },
    { text: `  socket: {`, type: "code", activeFor: [0] },
    { text: `    reconnectStrategy: (retries) => Math.min(retries * 50, 500)`, type: "code", activeFor: [0] },
    { text: `  }`, type: "code", activeFor: [0] },
    { text: `});`, type: "code", activeFor: [0] },
    { text: ``, type: "blank" },
    { text: `redis.connect();`, type: "code", activeFor: [0] },
    { text: ``, type: "blank" },
    { text: `export async function storeSession(userId, sessionData, ttlSeconds) {`, type: "code", activeFor: [1] },
    { text: `  const key = \`session:\${userId}\`;`, type: "code", activeFor: [1] },
    { text: `  await redis.set(key, JSON.stringify(sessionData), {`, type: "code", activeFor: [1] },
    { text: `    EX: ttlSeconds`, type: "code", activeFor: [1] },
    { text: `  });`, type: "code", activeFor: [1] },
    { text: `}`, type: "code", activeFor: [1] },
    { text: ``, type: "blank" },
    { text: `export async function getSession(userId) {`, type: "code", activeFor: [1] },
    { text: `  const key = \`session:\${userId}\`;`, type: "code", activeFor: [1] },
    { text: `  const data = await redis.get(key);`, type: "code", activeFor: [1] },
    { text: `  return data ? JSON.parse(data) : null;`, type: "code", activeFor: [1] },
    { text: `}`, type: "code", activeFor: [1] },
    { text: ``, type: "blank" },
    { text: `export async function revokeSession(userId) {`, type: "code", activeFor: [2] },
    { text: `  const key = \`session:\${userId}\`;`, type: "code", activeFor: [2] },
    { text: `  await redis.del(key);`, type: "code", activeFor: [2] },
    { text: `}`, type: "code", activeFor: [2] },
  ],
  nextChapter: {
    number: 4,
    title: "Refresh Mechanics",
  },
  quiz: {
    question: "What is the primary advantage of using Redis for session mapping over a standard RDBMS?",
    options: [
      "It supports one-to-many relations natively.",
      "It encrypts passwords automatically.",
      "O(1) fast deletion and time-to-live features.",
      "It caches the entire database structure."
    ],
    correctOptionIndex: 2,
    successMessage: "Exactly! Redis offers O(1) performance and built-in TTL for auto-expiration."
  },
  progress: 0,
};

export const AUTH_CHAPTER_4 = {
  chapterNumber: 4,
  chapterTitle: "Refresh Mechanics",
  storyTitle: "The Silent Guardian: Token Refresh In Action",
  storyIntro:
    "Access tokens expire quickly for security. But users hate logging in repeatedly. The refresh flow solves this tension elegantly.",
  sections: [
    {
      id: "section-1",
      heading: "1. Intercepting Expired Tokens",
      paragraphs: [
        {
          text: "Our Axios interceptor catches 401 responses and automatically attempts a token refresh before retrying the original request via",
          codeRef: "axios.interceptors.response",
          codeRefHighlight: true,
          suffix: ".",
        },
      ],
    },
    {
      id: "section-2",
      heading: "2. The Refresh Endpoint",
      paragraphs: [
        {
          text: "The server reads the HTTP-only cookie, validates the refresh token, and issues a fresh access token. The old refresh token is rotated to prevent replay attacks.",
        },
      ],
    },
    {
      id: "section-3",
      heading: "3. Queue & Retry",
      paragraphs: [
        {
          text: "If multiple requests fail simultaneously, we queue them and replay once the new token arrives. This prevents a thundering herd of refresh calls.",
        },
      ],
    },
  ],
  codeFile: "axios.interceptor.ts",
  codeLines: [
    { text: `import axios from 'axios';`, type: "import" },
    { text: ``, type: "blank" },
    { text: `let isRefreshing = false;`, type: "code", activeFor: [0] },
    { text: `let failedQueue = [];`, type: "code", activeFor: [2] },
    { text: ``, type: "blank" },
    { text: `axios.interceptors.response.use(`, type: "code", activeFor: [0] },
    { text: `  (response) => response,`, type: "code", activeFor: [0] },
    { text: `  async (error) => {`, type: "code", activeFor: [0] },
    { text: `    const originalRequest = error.config;`, type: "code", activeFor: [0] },
    { text: ``, type: "blank" },
    { text: `    if (error.response?.status === 401 && !originalRequest._retry) {`, type: "code", activeFor: [0] },
    { text: `      originalRequest._retry = true;`, type: "code", activeFor: [0] },
    { text: ``, type: "blank" },
    { text: `      if (isRefreshing) {`, type: "code", activeFor: [2] },
    { text: `        return new Promise((resolve, reject) => {`, type: "code", activeFor: [2] },
    { text: `          failedQueue.push({ resolve, reject });`, type: "code", activeFor: [2] },
    { text: `        }).then(token => {`, type: "code", activeFor: [2] },
    { text: `          originalRequest.headers['Authorization'] = 'Bearer ' + token;`, type: "code", activeFor: [2] },
    { text: `          return axios(originalRequest);`, type: "code", activeFor: [2] },
    { text: `        });`, type: "code", activeFor: [2] },
    { text: `      }`, type: "code", activeFor: [2] },
    { text: ``, type: "blank" },
    { text: `      isRefreshing = true;`, type: "code", activeFor: [1] },
    { text: `      const { data } = await axios.post('/api/v1/auth/refresh');`, type: "code", activeFor: [1] },
    { text: `      const newToken = data.accessToken;`, type: "code", activeFor: [1] },
    { text: ``, type: "blank" },
    { text: `      processQueue(null, newToken);`, type: "code", activeFor: [1, 2] },
    { text: `      isRefreshing = false;`, type: "code", activeFor: [1] },
    { text: ``, type: "blank" },
    { text: `      originalRequest.headers['Authorization'] = 'Bearer ' + newToken;`, type: "code", activeFor: [1] },
    { text: `      return axios(originalRequest);`, type: "code", activeFor: [1] },
    { text: `    }`, type: "code" },
    { text: `    return Promise.reject(error);`, type: "code" },
    { text: `  }`, type: "code" },
    { text: `);`, type: "code" },
  ],
  nextChapter: null,
  progress: 0,
};

/**
 * Lookup map: chapterIndex (1-based) → chapter data
 */
export const CHAPTERS_MAP = {
  1: AUTH_CHAPTER_1,
  2: AUTH_CHAPTER_2,
  3: AUTH_CHAPTER_3,
  4: AUTH_CHAPTER_4,
};
