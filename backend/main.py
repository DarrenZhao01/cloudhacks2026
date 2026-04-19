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
from dotenv import load_dotenv


_backend_dir = os.path.dirname(os.path.abspath(__file__))
_repo_root = os.path.dirname(_backend_dir)
# Monorepo: optional shared vars at repo root; backend/.env wins when both define the same key.
load_dotenv(os.path.join(_repo_root, ".env"))
load_dotenv(os.path.join(_backend_dir, ".env"), override=True)


# ─── Configuration ────────────────────────────────────────────────────────────
LOCAL_MODE = os.getenv("LOCAL_MODE", "false").lower() == "true"
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")


# AgentCore Runtime ARNs (set after deploying workers). *_AGENT_ARN names are optional aliases.
CODE_EXPLORER_ARN = os.getenv("CODE_EXPLORER_ARN") or os.getenv("CODE_EXPLORER_AGENT_ARN", "")
NARRATIVE_WRITER_ARN = os.getenv("NARRATIVE_WRITER_ARN") or os.getenv("NARRATIVE_WRITER_AGENT_ARN", "")
ASSESSMENT_CREATOR_ARN = os.getenv("ASSESSMENT_CREATOR_ARN") or os.getenv("ASSESSMENT_CREATOR_AGENT_ARN", "")




def _missing_agentcore_arns() -> list[str]:
   """Return names of required worker runtime ARNs when AgentCore mode is active."""
   if LOCAL_MODE:
       return []
   missing: list[str] = []
   if not CODE_EXPLORER_ARN.strip():
       missing.append("CODE_EXPLORER_ARN")
   if not NARRATIVE_WRITER_ARN.strip():
       missing.append("NARRATIVE_WRITER_ARN")
   if not ASSESSMENT_CREATOR_ARN.strip():
       missing.append("ASSESSMENT_CREATOR_ARN")
   return missing


# ─── AgentCore Runtime Client ─────────────────────────────────────────────────
if not LOCAL_MODE:
   agentcore_client = boto3.client("bedrock-agentcore", region_name=AWS_REGION)




def _invoke_remote_agent(agent_arn: str, prompt: str, session_id: str = None) -> str:
   """Call a worker agent deployed on AgentCore Runtime via A2A."""
   if not agent_arn:
       return json.dumps({"error": "Agent ARN not configured. Set the environment variable."})


   if session_id is None:
       session_id = f"session_{uuid.uuid4().hex}"


   req_id = uuid.uuid4().hex
   a2a_payload = {
       "jsonrpc": "2.0",
       "id": req_id,
       "method": "message/send",
       "params": {
           "message": {
               "role": "user",
               "parts": [{"kind": "text", "text": prompt}],
               "messageId": f"msg_{req_id}"
           }
       }
   }
   payload = json.dumps(a2a_payload).encode("utf-8")


   response = agentcore_client.invoke_agent_runtime(
       agentRuntimeArn=agent_arn,
       runtimeSessionId=session_id,
       payload=payload,
   )


   result_json = json.loads(response["response"].read().decode("utf-8"))
  
   if "error" in result_json:
       raise Exception(f"A2A Agent Runtime Error: {result_json['error']}")
      
   try:
       return result_json["result"]["artifacts"][0]["parts"][0]["text"]
   except (KeyError, IndexError):
       return json.dumps(result_json)




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
def get_supervisor_prompt(owner: str, repo: str) -> str:
   return f"""\
You are the Documentation Supervisor. You orchestrate three specialist agents to produce interactive, story-driven code documentation for the GitHub repository: {owner}/{repo}.


## Your tools
| Tool                      | What it does                                                      |
|---------------------------|-------------------------------------------------------------------|
| invoke_code_explorer      | Retrieves repo trees, file contents, and code search results      |
| invoke_narrative_writer   | Transforms raw code into engaging narrative chapters              |
| invoke_assessment_creator | Generates a knowledge-check quiz question for a chapter           |


## Workflow
When the user requests documentation for the repository:


1. **Explore** — Call `invoke_code_explorer` passing owner="{owner}" and repo="{repo}" to get the root directory tree to understand the codebase layout.
2. **Plan** — Decide on 1 "Story" category (e.g. "Architecture", "Backend", "Frontend"). Inside that story, create 1 "Journey".
3. **Draft Chapters** — Identify 2 to 3 core files. For each file:
   - Get the file contents using `invoke_code_explorer` (owner="{owner}", repo="{repo}").
   - Pass the file contents to `invoke_narrative_writer` to write the narrative metadata and sections (with `highlightRanges`). It will return an array of chapters.
   - Pass the narrative to `invoke_assessment_creator` to generate a checkpoint quiz.
4. **Assemble** — Combine the generated chapters into a SINGLE complete JSON response that maps exactly to the frontend state.


## Output Format
Your final output MUST be a JSON object nested exactly like this. DO NOT wrap it in markdown blockquotes, return raw JSON:


{{
 "stories": [
   {{
     "id": "story-1",
     "title": "Welcome to the Codebase",
     "description": "A high-level overview of the repository components",
     "category": "Architecture",
     "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
     "estimatedTime": "15 min",
     "journeys": ["journey-1"]
   }}
 ],
 "journeys": {{
   "journey-1": {{
     "id": "journey-1",
     "title": "Core Architecture",
     "description": "Learn the primary structure of the application.",
     "category": "Architecture",
     "author": {{ "name": "AI Orchestrator", "avatar": "https://ui-avatars.com/api/?name=AI&background=0D8ABC&color=fff" }},
     "estimatedTime": "15 min",
     "chapters": [
       {{ "id": "chapter-1", "title": "Main entrypoint", "description": "The root of the app." }},
       {{ "id": "chapter-2", "title": "Routing", "description": "How the app routes." }}
     ]
   }}
 }},
 "chapters": {{
   "journey-1-1": {{
      "chapterNumber": 1,
      "chapterTitle": "Main entrypoint",
      "storyTitle": "Starting the application",
      "storyIntro": "This is where it all begins.",
      "codeFile": "src/index.js",
      "code": "import App from './App';\\n\\nApp.start();",
      "sections": [
        {{
          "id": "section-1",
          "heading": "Imports",
          "paragraphs": [
             {{ "text": "We import the app", "codeRef": "App", "codeRefHighlight": true }}
          ],
          "highlightRanges": [1]
        }}
      ],
      "quiz": {{
        "question": "What is imported?",
        "options": ["App", "Router", "Auth"],
        "correctOptionIndex": 0,
        "successMessage": "Correct!"
      }},
      "nextChapter": {{ "number": 2, "title": "Routing" }}
   }}
 }}
}}


## Rule Reminders
- You MUST generate the explicit JSON keys: `stories`, `journeys`, and `chapters`.
- The keys in the `chapters` object MUST be formatted as `{{journey_id}}-{{chapterIndex}}`, for example `journey-1-1`.
- The `highlightRanges` should be an array of integers representing 1-indexed line numbers of the `code` string.
- Output NOTHING BUT VALID JSON.
"""


supervisor_model = BedrockModel(
   model_id="us.anthropic.claude-sonnet-4-6",
   region_name=AWS_REGION,
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




import re


@app.post("/orchestrate")
async def orchestrate(request: ChatRequest):
   """Full documentation pipeline — supervisor orchestrates all worker agents."""
   missing_arns = _missing_agentcore_arns()
   if missing_arns:
       raise HTTPException(
           status_code=503,
           detail=(
               "Bedrock AgentCore mode requires these environment variables (each = that worker's "
               "agent runtime ARN from the console): "
               + ", ".join(missing_arns)
               + ". Use CODE_EXPLORER_ARN, NARRATIVE_WRITER_ARN, ASSESSMENT_CREATOR_ARN "
               "(or the *_AGENT_ARN aliases). Export them or add backend/.env. "
               "For local dev without deployed workers, set LOCAL_MODE=true."
           ),
       )
   try:
       url = request.prompt.strip().rstrip('/')
       parts = url.split('/')
       if len(parts) >= 2:
           repo = parts[-1]
           owner = parts[-2]
       else:
           owner = "unknown"
           repo = "unknown"
          
       dynamic_prompt = get_supervisor_prompt(owner, repo)
      
       supervisor_agent = Agent(
           name="supervisor",
           model=supervisor_model,
           system_prompt=dynamic_prompt,
           tools=[invoke_code_explorer, invoke_narrative_writer, invoke_assessment_creator],
       )


       raw_response = supervisor_agent(f"Generate curriculum for repository {owner}/{repo}.")
       response_text = str(raw_response)
      
       # Strip potential markdown fences to parse JSON
       # Actually a simpler regex or manual strip:
       cleaned_text = response_text.strip()
       if cleaned_text.startswith("```json"):
           cleaned_text = cleaned_text[7:]
       if cleaned_text.startswith("```"):
           cleaned_text = cleaned_text[3:]
       if cleaned_text.endswith("```"):
           cleaned_text = cleaned_text[:-3]
      
       try:
           data = json.loads(cleaned_text.strip())
       except json.JSONDecodeError:
           # Fallback regex extraction if there's conversational garbage
           match = re.search(r'(\{.*\})', response_text, re.DOTALL)
           if match:
               data = json.loads(match.group(1))
           else:
               raise ValueError("Could not parse JSON from LLM output")
          
       return {
           "status": "success",
           "stories": data.get("stories", []),
           "journeys": data.get("journeys", {}),
           "chapters": data.get("chapters", {})
       }
   except HTTPException:
       raise
   except Exception as e:
       print("Error Orchestrating: ", str(e))
       raise HTTPException(status_code=500, detail=str(e))




@app.post("/explore")
async def explore(request: ChatRequest):
   """Quick repo exploration — code_explorer agent only."""
   if not LOCAL_MODE and not CODE_EXPLORER_ARN.strip():
       raise HTTPException(
           status_code=503,
           detail=(
               "CODE_EXPLORER_ARN (or CODE_EXPLORER_AGENT_ARN) is not set. "
               "Add it to your environment or backend/.env, or set LOCAL_MODE=true for local development."
           ),
       )
   try:
       result = invoke_code_explorer(request.prompt)
       return {"status": "success", "output": result}
   except HTTPException:
       raise
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

