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
  progress: 35,
};
