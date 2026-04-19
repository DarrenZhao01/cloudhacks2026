# Onboard
A truly distributed, multi-agent platform for dynamically converting complex software repositories into interactive, narrative-driven documentation and assessments.

## Architecture
The system employs a Supervisor-Worker agentic architecture built on **Amazon Bedrock AgentCore** and the **Strands SDK**:
* **Frontend**: A React web application for submitting repository targets and reading the generated output.
* **Supervisor Orchestrator**: A FastAPI backend (`main.py`) running Claude Sonnet. It's responsible for analyzing user intents, planning documentation routes, and synchronously triggering the correct sub-agents via the JSON-RPC Agent-to-Agent (A2A) protocol.
* **Code Explorer Agent**: A distributed A2A worker deployed on AWS AgentCore. Uses custom tools to fetch GitHub repository trees and exact source code via external Lambda connections.
* **Narrative Writer Agent**: A distributed A2A worker that crafts rich, educational narrative chapters based on the code structures retrieved.
* **Assessment Creator Agent**: A distributed A2A worker that automatically generates dynamic quizzes and knowledge checks corresponding with each narrative chapter.

All agentic workers operate statelessly, with the conversation context completely managed and routed by the Supervisor.

## Directory Structure
- `/frontend/` - React SPA user interface
- `/backend/` - Supervisor orchestration logic (`main.py`) & REST API
- `/backend/agents/code_explorer/coder` - AWS Bedrock AgentCore project for the Code Explorer sub-agent
- `/backend/agents/narrative_writer/narrator` - AWS Bedrock AgentCore project for the Narrative Writer sub-agent
- `/backend/agents/assessment_creator/assessor` - AWS Bedrock AgentCore project for the Assessment Creator sub-agent
- `/infrastructure/` - AWS CDK definitions for orchestrator deployment to ECS Fargate.

## Setup & Deployment

### 1. Deploy the Distributed Sub-Agents
The standard `agentcore` CLI is used to push the individual specialist agents to the AWS Bedrock AgentCore Runtime.
```bash
# Example: Deploy Code Explorer
cd backend/agents/code_explorer/coder
agentcore deploy
```
*(You must repeat this for the `narrative_writer/narrator` and `assessment_creator/assessor` projects)*

### 2. Configure Environment ARNs
Once all 3 agents are successfully deployed to the cloud, copy their generated Agent ARNs from the terminal outputs and update your `.env` file at the root of the project:
```env
CODE_EXPLORER_ARN=arn:aws:bedrock-agentcore:us-west-2:...
NARRATIVE_WRITER_ARN=arn:aws:bedrock-agentcore:us-west-2:...
ASSESSMENT_CREATOR_ARN=arn:aws:bedrock-agentcore:us-west-2:...
LAMBDA_URL=https://...
```
*Note: Any time you destroy and recreate your agent cloud stacks, these ARNs must be updated.*

### 3. Run the Supervisor Locally
The orchestrator requires Python 3.10+ and a set of standard AWS Credentials in your shell to authenticate via Boto3.
```bash
cd backend
python -m venv venv

# Activate venv on Windows:
venv\Scripts\activate
# Activate venv on macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --env-file ../.env --reload --port 8080
```

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

## Technologies Used
* Amazon Bedrock & Bedrock AgentCore
* AWS SDK (Boto3) & CDK
* Strands Agents SDK & A2A Protocols
* Python FastAPI
* React (TypeScript & Vite)
