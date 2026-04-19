from strands import Agent
from strands.multiagent.a2a.executor import StrandsA2AExecutor
from bedrock_agentcore.runtime import serve_a2a
from model.load import load_model
from memory.session import get_memory_session_manager

SYSTEM_PROMPT = """\
You are an Assessment Creator. You generate a single knowledge-check question for a documentation chapter.

## Input you will receive
- A narrative chapter (text + code snippets)

## Output format
Return ONLY a valid JSON object — no markdown fences, no extra text:

{
  "quiz": {
    "question": "A friendly, conversational question (e.g. 'Before we move on, which function validates the user token?')",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "successMessage": "A brief, encouraging confirmation or explanation of the right answer (1-2 sentences)"
  }
}

## Rules
1. Focus on the single most important architectural concept from the chapter.
2. Use a warm, conversational tone — the reader should feel encouraged, not tested.
3. All options must be plausible — avoid obviously wrong distractors.
4. The question must be answerable from the chapter content alone.
5. Output ONLY the JSON object — nothing else.
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

