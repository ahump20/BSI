# AWS Bedrock MCP Configuration Setup

## Overview
This configuration sets up AWS Bedrock integration with your MCP servers using the KMS key `AWS_Bedrock` (ID: `b27e1cdb-ed1e-4bb8-82fa-797c46c83aa4`) in the `us-east-2` region.

## Prerequisites
1. AWS Access Key ID and Secret Access Key
2. Proper IAM permissions for Bedrock operations
3. Access to the KMS key `AWS_Bedrock`

## Configuration Files Created

### 1. For Cursor MCP (`.cursor/mcp.json`)
Add this configuration to your `mcpServers` object:

```json
"aws-bedrock": {
  "command": "npx",
  "args": [
    "-y",
    "@smithery/cli@latest",
    "run",
    "@pipedream/aws_bedrock",
    "--key",
    "YOUR_AWS_ACCESS_KEY_ID",
    "--secret",
    "YOUR_AWS_SECRET_ACCESS_KEY",
    "--region",
    "us-east-2"
  ],
  "env": {
    "AWS_ACCESS_KEY_ID": "YOUR_AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY": "YOUR_AWS_SECRET_ACCESS_KEY",
    "AWS_DEFAULT_REGION": "us-east-2",
    "AWS_BEDROCK_REGION": "us-east-2",
    "AWS_KMS_KEY_ID": "b27e1cdb-ed1e-4bb8-82fa-797c46c83aa4",
    "AWS_KMS_KEY_ALIAS": "AWS_Bedrock",
    "AWS_ACCOUNT_ID": "808701193278"
  }
}
```

### 2. For Codex (`.codex/config.toml`)
Add this section to your `[mcp_servers]` section:

```toml
[mcp_servers.aws-bedrock]
command = "npx"
args = [ "-y", "@smithery/cli@latest", "run", "@pipedream/aws_bedrock", "--key", "YOUR_AWS_ACCESS_KEY_ID", "--secret", "YOUR_AWS_SECRET_ACCESS_KEY", "--region", "us-east-2" ]

  [mcp_servers.aws-bedrock.env]
  AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID"
  AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY"
  AWS_DEFAULT_REGION = "us-east-2"
  AWS_BEDROCK_REGION = "us-east-2"
  AWS_KMS_KEY_ID = "b27e1cdb-ed1e-4bb8-82fa-797c46c83aa4"
  AWS_KMS_KEY_ALIAS = "AWS_Bedrock"
  AWS_ACCOUNT_ID = "808701193278"
```

## Required AWS Credentials

You need to replace the following placeholders with your actual AWS credentials:

- `YOUR_AWS_ACCESS_KEY_ID`: Your AWS Access Key ID
- `YOUR_AWS_SECRET_ACCESS_KEY`: Your AWS Secret Access Key
- `YOUR_AWS_SESSION_TOKEN`: (Optional) If using temporary credentials

## Required IAM Permissions

Your AWS credentials need the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels",
        "bedrock:GetFoundationModel",
        "bedrock:CreateModelCustomizationJob",
        "bedrock:GetModelCustomizationJob",
        "bedrock:ListModelCustomizationJobs",
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:us-east-2:808701193278:key/b27e1cdb-ed1e-4bb8-82fa-797c46c83aa4"
    }
  ]
}
```

## KMS Key Policy

Your KMS key `AWS_Bedrock` should have a policy that allows Bedrock operations. Based on your existing policy, ensure it includes:

1. **Root user access** (for administrative purposes)
2. **Bedrock service access** for encryption/decryption
3. **IAM role access** for model operations

## Testing the Configuration

After adding the configuration:

1. Restart your IDE/editor
2. Test Bedrock model invocation through the MCP interface
3. Verify KMS key usage in AWS CloudTrail logs

## Security Notes

- Store AWS credentials securely (consider using AWS IAM roles instead of access keys)
- Enable CloudTrail logging for audit purposes
- Regularly rotate access keys
- Use least privilege principle for IAM permissions

## Troubleshooting

If you encounter issues:

1. Verify AWS credentials are correct
2. Check IAM permissions
3. Ensure KMS key policy allows your operations
4. Confirm the `us-east-2` region is correct for your Bedrock setup
5. Check CloudTrail logs for detailed error information

## Alternative MCP Servers

If the Pipedream AWS Bedrock server doesn't work, you can also try:

1. `@modelcontextprotocol/server-aws` (if available)
2. Custom AWS SDK integration
3. Direct Bedrock API calls through other MCP servers

## Support

For issues with:
- **MCP Server**: Check the Pipedream documentation
- **AWS Bedrock**: Refer to AWS Bedrock documentation
- **KMS**: Review AWS KMS documentation