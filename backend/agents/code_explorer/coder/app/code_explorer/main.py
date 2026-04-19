import os
import requests
from strands import Agent, tool
from strands.multiagent.a2a.executor import StrandsA2AExecutor
from bedrock_agentcore.runtime import serve_a2a
from model.load import load_model
from memory.session import get_memory_session_manager

LAMBDA_URL = os.getenv(
    "LAMBDA_URL",
    "https://tokfyvnqq2v7mbb5f2ldcwmxye0aqgnj.lambda-url.us-west-2.on.aws/"
)

@tool
def call_lambda_function(method: str = "tools/call", tool_name: str = "get_repository_tree", tool_args: dict = None) -> dict:
    """Calls the remote Lambda function which acts as an MCP server.

    Args:
        method: The JSON-RPC method (e.g. 'tools/call', 'tools/list'). Defaults to 'tools/call'.
        tool_name: The name of the specific tool to execute (e.g. 'get_repository_tree', 'get_file_contents', 'search_code').
        tool_args: A dictionary of specific arguments for the tool (e.g. {'owner': 'owner', 'repo': 'repo'}).
    """
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

    response = requests.post(LAMBDA_URL, json=payload)

    if response.status_code != 200:
        return {"error": f"Lambda returned {response.status_code}", "raw": response.text}

    if not response.text.strip():
        return {"error": "Lambda returned an empty response. Check if the method is correct."}

    return response.json()

SYSTEM_PROMPT = """\
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

def agent_factory():
    cache = {}
    def get_or_create_agent(session_id, user_id):
        key = f"{session_id}/{user_id}"
        if key not in cache:
            cache[key] = Agent(
                model=load_model(),
                session_manager=get_memory_session_manager(session_id, user_id),
                system_prompt=SYSTEM_PROMPT,
                tools=[call_lambda_function],
            )
        return cache[key]
    return get_or_create_agent

get_or_create_agent = agent_factory()
agent = get_or_create_agent("default-session", "default-user")

if __name__ == "__main__":
    serve_a2a(StrandsA2AExecutor(agent))
