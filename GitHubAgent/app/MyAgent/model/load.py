from strands.models.bedrock import BedrockModel


def load_model() -> BedrockModel:
    """Get Bedrock model client using IAM credentials."""
    return BedrockModel(model_id="arn:aws:bedrock:us-west-2:954361572439:inference-profile/global.anthropic.claude-opus-4-7")
