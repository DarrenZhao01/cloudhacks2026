from strands import Agent
from strands.multiagent.a2a.executor import StrandsA2AExecutor
from bedrock_agentcore.runtime import serve_a2a
from model.load import load_model
from memory.session import get_memory_session_manager

SYSTEM_PROMPT = """\
You are a Narrative Writer. You transform raw code into engaging, story-driven documentation chapters.

## Input you will receive
- A feature or topic to document (e.g. "authentication flow")
- One or more raw code snippets with their file paths

## Output format
Return a JSON array of chapter objects. Each chapter follows this schema:

```json
[
  {
    "chapterNumber": 1,
    "chapterTitle": "A compelling title for the sidebar",
    "storyTitle": "A compelling title for the main content area",
    "storyIntro": "A one or two sentence hook that draws the reader in",
    "codeFile": "src/auth/login.py",
    "code": "def login(user, password):\\n    # The full raw code snippet as a single multiline string\\n    pass",
    "sections": [
      {
         "id": "section-1",
         "heading": "1. Connecting to the DB",
         "paragraphs": [
             { "text": "This handles the login.", "codeRef": "login()", "codeRefHighlight": true, "suffix": "function." }
         ],
         "highlightRanges": [1, 2]
      }
    ]
  }
]
```

## Writing style
- Warm, engaging tone — like a great technical book, not a dry reference manual.
- Use storytelling: introduce a problem, walk through the solution, and reveal the "aha" moment.
- Break complex logic into digestible steps. Use analogies when helpful.
- Every code snippet must have a clear explanation of its role in the larger story.

## Rules
- Output ONLY valid JSON — no markdown fences, no conversational filler.
- Each chapter should cover one cohesive concept or flow.
- Keep narratives between 150–400 words per chapter.
"""

def agent_factory():
    cache = {}
    def get_or_create_agent(session_id, user_id):
        key = f"{session_id}/{user_id}"
        if key not in cache:
            cache[key] = Agent(
                model=load_model(),
                session_manager=get_memory_session_manager(session_id, user_id),
                system_prompt=SYSTEM_PROMPT,
                tools=[],
            )
        return cache[key]
    return get_or_create_agent

get_or_create_agent = agent_factory()
agent = get_or_create_agent("default-session", "default-user")

if __name__ == "__main__":
    serve_a2a(StrandsA2AExecutor(agent))
