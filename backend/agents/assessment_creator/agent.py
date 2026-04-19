# assessment_creator — AgentCore Runtime worker agent
import os
import json
from strands import Agent
from strands.models import BedrockModel
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

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

model = BedrockModel(
    model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    region_name=os.getenv("AWS_REGION", "us-west-2"),
)

agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[]
)


@app.entrypoint
def invoke(payload: dict, context) -> dict:
    user_message = payload.get("prompt", "")
    session_id = payload.get("session_id")

    response = agent(user_message)

    return {
        "response": str(response),
        "session_id": session_id,
    }
