# Amazon Bedrock

> Verified against GitMind `6.1.2` on September 3, 2026

GitMind calls Amazon Bedrock's Converse API through the official AWS SDK. It uses the standard AWS credential chain unless you choose a named shared-credentials profile.

- `gitmind.bedrock.region` selects the AWS region.
- `gitmind.bedrock.profile` optionally selects an AWS profile.
- `gitmind.bedrock.model` is a model ID enabled for the account and region.

Model availability varies by region and account, so GitMind preserves a manually entered model ID rather than bundling an unverified list. See [Amazon Bedrock APIs](https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html).
