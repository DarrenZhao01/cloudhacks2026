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

@tool
def call_lambda_function(method: str = "tools/call", tool_name: str = "get_repository_tree", tool_args: dict = None) -> dict:
    """Calls the remote Lambda function which acts as an MCP server.
    
    Args:
        method: The JSON-RPC method (e.g. 'tools/call', 'tools/list'). Defaults to 'tools/call'.
        tool_name: The name of the specific tool to execute (e.g. 'get_repository_tree', 'get_file_contents', 'search_code').
        tool_args: A dictionary of specific arguments for the tool (e.g. {'owner': 'owner', 'repo': 'repo'}).
    """
    lambda_url = "https://tokfyvnqq2v7mbb5f2ldcwmxye0aqgnj.lambda-url.us-west-2.on.aws/"
    
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
    response = requests.post(lambda_url, json=payload)
    
    if response.status_code != 200:
        return {"error": f"Lambda returned {response.status_code}", "raw": response.text}
        
    if not response.text.strip():
        return {"error": "Lambda returned an empty response. Check if the method is correct."}
        
    return response.json()

# Define the LLM — Claude via Bedrock
model = BedrockModel(
    model_id="us.anthropic.claude-sonnet-4-6",
    region_name="us-west-2",
)

SYSTEM_PROMPT = """
You are a code analysis agent with access to a GitHub repository: github/fakerepo.

You have a special tool `call_lambda_function` that acts as a gateway to the following internal tools:
- `get_repository_tree`: (owner, repo, tree_sha, recursive) - Use recursive=True for full layout.
- `get_file_contents`: (owner, repo, path, ref) - Read specific code files.
- `search_code`: (query) - Search code across GitHub.

When the user asks to see the code or repo structure, use `call_lambda_function` with tool_name='get_repository_tree' or 'get_file_contents' or 'search_code' depending on the prompt and tool_args={'owner': 'github', 'repo': 'fakerepo', 'recursive': True}.
Always cite the file path when referencing code.
"""

# Agent is instantiated once per cold start
github_agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[call_lambda_function]
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
    print(github_agent("Call the lambda function to retrieve the repo fakerepo"))
