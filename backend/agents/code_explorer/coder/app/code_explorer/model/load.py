from strands.models.bedrock import BedrockModel
import os

def load_model() -> BedrockModel:
    """Get Bedrock model client using IAM credentials."""
    return BedrockModel(
        model_id="us.anthropic.claude-sonnet-4-6",
        region_name=os.getenv("AWS_REGION", "us-west-2")
    )
