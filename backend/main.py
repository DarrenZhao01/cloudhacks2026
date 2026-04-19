# main.py — Supervisor Agent on ECS
# Orchestrates worker agents deployed to AgentCore Runtime via boto3.invoke_agent_runtime()
import os
import json
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
import uvicorn
from strands import Agent, tool
from strands.models import BedrockModel

# ─── Configuration ────────────────────────────────────────────────────────────
LOCAL_MODE = os.getenv("LOCAL_MODE", "false").lower() == "true"
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")

# AgentCore Runtime ARNs (set after deploying workers)
CODE_EXPLORER_ARN = os.getenv("CODE_EXPLORER_ARN", "")
NARRATIVE_WRITER_ARN = os.getenv("NARRATIVE_WRITER_ARN", "")
ASSESSMENT_CREATOR_ARN = os.getenv("ASSESSMENT_CREATOR_ARN", "")

# ─── AgentCore Runtime Client ─────────────────────────────────────────────────
if not LOCAL_MODE:
    agentcore_client = boto3.client("bedrock-agentcore", region_name=AWS_REGION)


def _invoke_remote_agent(agent_arn: str, prompt: str, session_id: str = None) -> str:
    """Call a worker agent deployed on AgentCore Runtime via A2A."""
    if not agent_arn:
        return json.dumps({"error": "Agent ARN not configured. Set the environment variable."})

    if session_id is None:
        session_id = f"session_{uuid.uuid4().hex}"

    payload = json.dumps({"prompt": prompt}).encode()

    response = agentcore_client.invoke_agent_runtime(
        agentRuntimeArn=agent_arn,
        runtimeSessionId=session_id,
        payload=payload,
    )

    return response["response"].read().decode("utf-8")


# ─── LOCAL MODE: fallback agents for development ──────────────────────────────
if LOCAL_MODE:
    import requests

    LAMBDA_URL = os.getenv(
        "LAMBDA_URL",
        "https://tokfyvnqq2v7mbb5f2ldcwmxye0aqgnj.lambda-url.us-west-2.on.aws/"
    )

    @tool
    def _local_lambda(method: str = "tools/call", tool_name: str = "get_repository_tree", tool_args: dict = None) -> dict:
        """Calls the remote Lambda function (local dev only)."""
        payload = {"jsonrpc": "2.0", "id": "1", "method": method}
        if method == "tools/call":
            payload["params"] = {"name": tool_name, "arguments": tool_args or {}}
        resp = requests.post(LAMBDA_URL, json=payload)
        if resp.status_code != 200:
            return {"error": f"Lambda returned {resp.status_code}", "raw": resp.text}
        if not resp.text.strip():
            return {"error": "Lambda returned an empty response."}
        return resp.json()

    _local_code_explorer = Agent(
        model=BedrockModel(model_id="us.anthropic.claude-sonnet-4-6", region_name=AWS_REGION),
        system_prompt="You are a Code Explorer. Use call_lambda_function to fetch repo trees and file contents. Return COMPLETE output.",
        tools=[_local_lambda],
    )
    _local_narrative_writer = Agent(
        model=BedrockModel(model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0", region_name=AWS_REGION),
        system_prompt="You are a Narrative Writer. Transform code into story-driven documentation. Output ONLY valid JSON.",
        tools=[],
    )
    _local_assessment_creator = Agent(
        model=BedrockModel(model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0", region_name=AWS_REGION),
        system_prompt="You are an Assessment Creator. Generate a quiz question JSON for a documentation chapter. Output ONLY valid JSON.",
        tools=[],
    )


# ─── Supervisor Tools (call remote workers) ───────────────────────────────────
@tool
def invoke_code_explorer(prompt: str) -> str:
    """Invoke the Code Explorer agent to retrieve repository trees, file contents, or search code on GitHub.

    Args:
        prompt: A natural-language instruction for the code explorer (e.g. 'Get the repository tree for owner/repo').
    """
    if LOCAL_MODE:
        return str(_local_code_explorer(prompt))
    return _invoke_remote_agent(CODE_EXPLORER_ARN, prompt)


@tool
def invoke_narrative_writer(prompt: str) -> str:
    """Invoke the Narrative Writer agent to transform code snippets into story-driven documentation chapters.

    Args:
        prompt: The code snippets and context to transform into narrative chapters.
    """
    if LOCAL_MODE:
        return str(_local_narrative_writer(prompt))
    return _invoke_remote_agent(NARRATIVE_WRITER_ARN, prompt)


@tool
def invoke_assessment_creator(prompt: str) -> str:
    """Invoke the Assessment Creator agent to generate a knowledge-check quiz question for a chapter.

    Args:
        prompt: The narrative chapter text and code snippets to generate a quiz for.
    """
    if LOCAL_MODE:
        return str(_local_assessment_creator(prompt))
    return _invoke_remote_agent(ASSESSMENT_CREATOR_ARN, prompt)


# ─── Supervisor Agent ─────────────────────────────────────────────────────────
SUPERVISOR_PROMPT = """\
You are the Documentation Supervisor. You orchestrate three specialist agents to produce interactive, story-driven code documentation.

## Your tools
| Tool                      | What it does                                                      |
|---------------------------|-------------------------------------------------------------------|
| invoke_code_explorer      | Retrieves repo trees, file contents, and code search results      |
| invoke_narrative_writer   | Transforms raw code into engaging narrative chapters              |
| invoke_assessment_creator | Generates a knowledge-check quiz question for a chapter           |

## Workflow
When the user requests documentation (e.g. "Document the authentication flow in owner/repo"):

1. **Plan** — Identify which files or features need exploring.
2. **Explore** — Call `invoke_code_explorer` with the owner, repo, and file paths. Collect all relevant code.
3. **Narrate** — Pass the collected code and context to `invoke_narrative_writer`. Ask it to produce one or more chapters.
4. **Assess** — For each chapter, pass the narrative + code to `invoke_assessment_creator` to generate a quiz question.
5. **Assemble** — Combine the chapters and quizzes into a single JSON response.

## Rules
- Always start by fetching the repository tree so you understand the codebase layout.
- Pass concrete code snippets to the narrative and assessment agents — do not ask them to fetch code themselves.
- If an agent returns an error, retry once, then report the issue to the user.
- Keep your own output concise; the detailed content lives in the agent responses.
"""

supervisor_model = BedrockModel(
    model_id="us.anthropic.claude-sonnet-4-6",
    region_name=AWS_REGION,
)

supervisor_agent = Agent(
    name="supervisor",
    model=supervisor_model,
    system_prompt=SUPERVISOR_PROMPT,
    tools=[invoke_code_explorer, invoke_narrative_writer, invoke_assessment_creator],
)


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(title="Documentation Supervisor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    prompt: str
    user_id: str = "anonymous"


@app.post("/orchestrate")
async def orchestrate(request: ChatRequest):
    """Full documentation pipeline — supervisor orchestrates all worker agents."""
    try:
        result = str(supervisor_agent(request.prompt))
        return {"status": "success", "output": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/explore")
async def explore(request: ChatRequest):
    """Quick repo exploration — code_explorer agent only."""
    try:
        result = invoke_code_explorer(request.prompt)
        return {"status": "success", "output": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "mode": "local" if LOCAL_MODE else "agentcore",
        "agents": {
            "code_explorer": CODE_EXPLORER_ARN or "(local)",
            "narrative_writer": NARRATIVE_WRITER_ARN or "(local)",
            "assessment_creator": ASSESSMENT_CREATOR_ARN or "(local)",
        }
    }


if __name__ == "__main__":
    print(f"Starting supervisor in {'LOCAL' if LOCAL_MODE else 'AGENTCORE'} mode...")
    uvicorn.run(app, host="0.0.0.0", port=8080)