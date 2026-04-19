from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_iam as iam,
)
from constructs import Construct

class InfrastructureStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create a VPC for the ECS Cluster
        vpc = ec2.Vpc(
            self, "AgentcoreVpc",
            max_azs=2
        )

        # Create an ECS Cluster
        cluster = ecs.Cluster(
            self, "AgentcoreCluster",
            vpc=vpc
        )

        # Create the Fargate Service with a Load Balancer
        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "SupervisorFargateService",
            cluster=cluster,
            cpu=512,
            memory_limit_mib=1024,
            desired_count=1,
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_asset("../backend"),
                container_port=8080,
                environment={
                    "AWS_REGION": self.region,
                    "LOCAL_MODE": "false",
                    # ARNs for remote agents will dynamically be passed via env vars/parameter store in production
                    "CODE_EXPLORER_ARN": "arn:aws:bedrock-agentcore:us-west-2:641748024059:runtime/coder_code_explorer-6VW2x1Hw4o",
                    "NARRATIVE_WRITER_ARN": "arn:aws:bedrock-agentcore:us-west-2:641748024059:runtime/narrator_narrativer_writer-NHanL04Og0",
                    "ASSESSMENT_CREATOR_ARN": "arn:aws:bedrock-agentcore:us-west-2:641748024059:runtime/assessor_assessment_creator-4yn4q04Tvu",
                }
            ),
            public_load_balancer=True
        )

        # Grant the Fargate task permissions to invoke Bedrock AgentCore Runtimes
        fargate_service.task_definition.task_role.add_to_principal_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeAgent"],
                resources=["*"]
            )
        )
