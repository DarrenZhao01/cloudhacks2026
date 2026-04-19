# agent.py
import os
import json
import boto3
import requests
from strands import Agent, tool
from strands.models import BedrockModel
from bedrock_agentcore.runtime import BedrockAgentCoreApp



# app = BedrockAgentCoreApp()

# # Pull GitHub token from Secrets Manager at cold start
# def get_github_token():
#     client = boto3.client("secretsmanager", region_name="us-west-2")
#     secret = client.get_secret_value(SecretId="agent/github-pat")
#     return json.loads(secret["SecretString"])["token"]

# GITHUB_TOKEN = get_github_token()

LAMBDA_URL = "https://tokfyvnqq2v7mbb5f2ldcwmxye0aqgnj.lambda-url.us-west-2.on.aws/"

@tool
def call_lambda_function(method: str = "tools/call", tool_name: str = "get_repository_tree", tool_args: dict = None) -> dict:
    """Calls the remote Lambda function which acts as an MCP server.
    
    Args:
        method: The JSON-RPC method (e.g. 'tools/call', 'tools/list'). Defaults to 'tools/call'.
        tool_name: The name of the specific tool to execute (e.g. 'get_repository_tree', 'get_file_contents', 'search_code').
        tool_args: A dictionary of specific arguments for the tool (e.g. {'owner': 'owner', 'repo': 'repo'}).
    """
    
    # Construct JSON-RPC payload to match Lambda logic
    payload = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": method
    }
    
    if method == "tools/call":
        payload["params"] = {
            "name": tool_name,
            "arguments": tool_args or {}
        }

    # Must use POST to transmit the body to the Lambda
    response = requests.post(LAMBDA_URL, json=payload)
    
    if response.status_code != 200:
        return {"error": f"Lambda returned {response.status_code}", "raw": response.text}
        
    if not response.text.strip():
        return {"error": "Lambda returned an empty response. Check if the method is correct."}
        
    return response.json()

# Define the LLM — Claude via Bedrock
model_supervisor = BedrockModel(
    model_id="us.anthropic.claude-sonnet-4-6",
    region_name="us-west-2",
)

model_code_explorer = BedrockModel(
    model_id="us.anthropic.claude-sonnet-4-6",
    region_name="us-west-2",
)

model_narrative_writer = BedrockModel(
    model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    region_name="us-west-2",
)

model_assessment_creator = BedrockModel(
    model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    region_name="us-west-2",
)

# ── SYSTEM PROMPT: Code Explorer ──────────────────────────────────────────────
SYSTEM_PROMPT1 = """\
You are a Code Explorer agent. Your job is to retrieve code and repository structure from GitHub via a single tool: `call_lambda_function`.

## Available tools (via call_lambda_function)

| tool_name               | Required tool_args                                  | Description                        |
|-------------------------|-----------------------------------------------------|------------------------------------|
| get_repository_tree     | owner, repo, recursive (bool, default True)         | List all files and directories     |
| get_file_contents       | owner, repo, path                                   | Read the raw content of one file   |
| search_code             | query                                               | Search code across all of GitHub   |

## Rules
1. Extract `owner` and `repo` from the user's request. Never leave them blank.
2. Always set `recursive: true` when fetching the tree unless told otherwise.
3. Return the COMPLETE tool output — never summarize or truncate.
4. When referencing code, always cite the full file path (e.g. `src/auth/login.py`).
5. If a tool returns an error, report the exact error message and suggest the likely cause.

## Example call
call_lambda_function(
    method="tools/call",
    tool_name="get_file_contents",
    tool_args={"owner": "IAmTomShaw", "repo": "f1-race-replay", "path": "README.md"}
)
"""

# ── SYSTEM PROMPT: Supervisor ────────────────────────────────────────────────
SYSTEM_PROMPT2 = """\
You are the Documentation Supervisor. You orchestrate three specialist agents to produce interactive, story-driven code documentation.

## Your agents
| Agent name          | What it does                                                      |
|---------------------|-------------------------------------------------------------------|
| code_explorer       | Retrieves repo trees, file contents, and code search results      |
| narrative_writer    | Transforms raw code into engaging narrative chapters              |
| assessment_creator  | Generates a knowledge-check quiz question for a chapter           |

## Workflow
When the user requests documentation (e.g. "Document the authentication flow in owner/repo"):

1. **Plan** — Identify which files or features need exploring.
2. **Explore** — Delegate to `code_explorer` with the owner, repo, and file paths. Collect all relevant code.
3. **Narrate** — Pass the collected code and context to `narrative_writer`. Ask it to produce one or more chapters.
4. **Assess** — For each chapter, pass the narrative + code to `assessment_creator` to generate a quiz question.
5. **Assemble** — Combine the chapters and quizzes into a single JSON response matching the frontend schema.

## Rules
- Always start by fetching the repository tree so you understand the codebase layout.
- Pass concrete code snippets to the narrative and assessment agents — do not ask them to fetch code themselves.
- If an agent returns an error, retry once, then report the issue to the user.
- Keep your own output concise; the detailed content lives in the agent responses.
"""

# ── SYSTEM PROMPT: Narrative Writer ──────────────────────────────────────────
SYSTEM_PROMPT3 = """\
You are a Narrative Writer. You transform raw code into engaging, story-driven documentation chapters.

## Input you will receive
- A feature or topic to document (e.g. "authentication flow")
- One or more raw code snippets with their file paths

## Output format
Return a JSON array of chapter objects. Each chapter follows this schema:

```json
[
  {
    "chapter_title": "A compelling title for this section",
    "summary": "A one-sentence hook that draws the reader in",
    "narrative": "The full narrative text (multiple paragraphs). Use markdown for formatting.",
    "code_snippets": [
      {
        "file_path": "src/auth/login.py",
        "language": "python",
        "code": "def login(user, password): ...",
        "explanation": "Why this code matters in the story"
      }
    ],
    "key_concepts": ["concept_1", "concept_2"]
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

# ── SYSTEM PROMPT: Assessment Creator ────────────────────────────────────────
SYSTEM_PROMPT4 = """\
You are an Assessment Creator. You generate a single knowledge-check question for a documentation chapter.

## Input you will receive
- A narrative chapter (text + code snippets)

## Output format
Return ONLY a valid JSON object — no markdown fences, no extra text:

{
  "checkpoint": {
    "question": "A friendly, conversational question (e.g. 'Before we move on, which function validates the user token?')",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "feedback": {
      "success": "A brief, encouraging confirmation (1 sentence)",
      "correction": "A gentle explanation of the right answer (1-2 sentences)"
    }
  }
}

## Rules
1. Focus on the single most important architectural concept from the chapter.
2. Use a warm, conversational tone — the reader should feel encouraged, not tested.
3. All options must be plausible — avoid obviously wrong distractors.
4. The question must be answerable from the chapter content alone.
5. Output ONLY the JSON object — nothing else.
"""

# Agent is instantiated once per cold start
github_agent = Agent(
    name="code_explorer",
    description="Explores GitHub repositories — retrieves file trees, reads file contents, and searches code.",
    model=model_code_explorer,
    system_prompt=SYSTEM_PROMPT1,
    tools=[call_lambda_function]
)

narrative_agent = Agent(
    name="narrative_writer",
    description="Transforms raw code snippets into engaging, story-driven documentation chapters.",
    model=model_narrative_writer,
    system_prompt=SYSTEM_PROMPT3,
    tools=[]
)

assessment_agent = Agent(
    name="assessment_creator",
    description="Generates knowledge-check quiz questions from technical narratives and code.",
    model=model_assessment_creator,
    system_prompt=SYSTEM_PROMPT4,
    tools=[]
)

supervisor_agent = Agent(
    name="supervisor",
    description="Orchestrates the documentation pipeline by delegating to specialized agents.",
    model=model_supervisor,
    system_prompt=SYSTEM_PROMPT2,
    tools=[github_agent, narrative_agent, assessment_agent]
)



# @app.entrypoint
# def invoke(payload: dict, context) -> dict:
#     user_message = payload.get("prompt", "")
#     session_id = payload.get("session_id")  # AgentCore Memory uses this

#     response = github_agent(user_message)

#     return {
#         "response": str(response),
#         "session_id": session_id,
#     }



if __name__ == "__main__":
    import sys

    # Quick mode: just explore a repo  →  py agent.py --explore IAmTomShaw/f1-race-replay
    # Full mode: generate documentation →  py agent.py IAmTomShaw/f1-race-replay
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  py agent.py <owner/repo>                  — Full documentation pipeline (supervisor)")
        print("  py agent.py --explore <owner/repo>        — Quick repo exploration only")
        sys.exit(1)

    if sys.argv[1] == "--explore":
        repo = sys.argv[2] if len(sys.argv) > 2 else "IAmTomShaw/f1-race-replay"
        owner, repo_name = repo.split("/")
        print(github_agent(f"Retrieve the full repository tree for {repo_name} by {owner}"))
    else:
        repo = sys.argv[1]
        owner, repo_name = repo.split("/")
        prompt = f"Generate interactive, story-driven documentation for the repository {owner}/{repo_name}. Start by exploring the repo structure, then create narrative chapters for the key features, and include a quiz question for each chapter."
        print(supervisor_agent(prompt))
