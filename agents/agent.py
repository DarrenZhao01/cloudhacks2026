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

SYSTEM_PROMPT1 = """
You are a code analysis agent with access to a GitHub repository: github/fakerepo.

You have a special tool `call_lambda_function` that acts as a gateway to the following internal tools:
- `get_repository_tree`: (owner, repo, tree_sha, recursive) - Use recursive=True for full layout.
- `get_file_contents`: (owner, repo, path, ref) - Read specific code files.
- `search_code`: (query) - Search code across GitHub.

When the user asks to see the code or repo structure, use `call_lambda_function` with tool_name='get_repository_tree' or 'get_file_contents' or 'search_code' depending on the prompt and tool_args={'owner': 'AntonK0', 'repo': 'webjam2025', 'recursive': True}.
Always cite the file path when referencing code.
"""

SYSTEM_PROMPT2 = """
You are a Documentation Supervisor Agent that orchestrates the creation of interactive code documentation.

When a user requests documentation for a specific codebase feature (e.g., "authentication flow"), you:

1. Analyze the request to understand what code areas need to be explored
2. Delegate to the Code Explorer Agent to find and retrieve relevant code
3. Delegate to the Narrative Agent to create the story-driven documentation
4. Coordinate the final structured output for the frontend

Always maintain context about the overall documentation goal and ensure all agents work toward creating engaging, story-driven technical content.
"""

SYSTEM_PROMPT3 = """
You are a Narrative Agent that transforms technical code into engaging, story-driven documentation.

Your role:
1. Take raw code snippets and technical details from the Code Explorer
2. Create compelling narratives that explain how the code works
3. Structure content as interactive "chapters" of a technical story
4. Output strictly formatted JSON that matches the frontend schema

Writing style:
- Warm, engaging tone like reading a good technical book
- Use storytelling techniques to explain complex logic flows
- Break down complex concepts into digestible narrative chunks
- Include code snippets with clear explanations of their purpose in the larger story
"""

SYSTEM_PROMPT4 = """
You are an Assessment Validation Agent for a technical codebase onboarding platform. Your sole responsibility is to analyze a given technical narrative and its corresponding raw code, and then generate a single, encouraging knowledge-check question for the end of the chapter.
Instructions:
	1.	Analyze Context: Review the provided narrative text and code snippet to identify the single most important architectural concept the engineer needs to understand before moving on.
	2.	Formulate the Question: Write a brief, friendly question testing this concept. Use a warm, conversational tone (e.g., "Before we move on, what handles the token refresh?").
	3.	Generate Options: Provide 3 to 4 concise, plausible multiple-choice options.
	4.	Provide Feedback: Write a brief success message for the correct answer and a gentle, guiding correction for the incorrect answers.
	5.	Strict JSON Output: You must return only a valid JSON object matching the exact schema below. Do not wrap the JSON in markdown blocks or include any conversational filler.

    ```
    {
  "checkpoint": {
    "question": "String (The friendly question text)",
    "options":,
    "correct_index": "Integer (The 0-based index of the correct option)",
    "feedback": {
      "success": "String (Encouraging confirmation)",
      "correction": "String (Gentle course-correction explaining the right answer)"
    }
  }
}
```
"""

# Agent is instantiated once per cold start
github_agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT1,
    tools=[call_lambda_function]
)

supervisor_agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT2,
    tools=[github_agent, narrative_agent]
)

narrative_agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT3,
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
