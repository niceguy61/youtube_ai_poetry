# Poetry Generation Lambda Function

AI-powered poetry generation using AWS Bedrock (Claude models) based on audio analysis features.

## Overview

This Lambda function generates poetry inspired by music characteristics. It uses AWS Bedrock's Claude models to create evocative verses that reflect the mood, tempo, energy, and other audio features.

## Features

- **11 Personas**: hamlet, nietzsche, yi-sang, baudelaire, rimbaud, kim-soo-young, yun-dong-ju, edgar-allan-poe, oscar-wilde, kafka, baek-seok
- **7 Languages**: Korean (ko), English (en), Japanese (ja), Chinese (zh), French (fr), German (de), Spanish (es)
- **2 Claude Models**: Claude 3 Haiku (fast, cost-effective) and Claude 3.5 Sonnet (premium quality)
- **Audio-Driven**: Poetry reflects tempo, energy, mood, intensity, and other musical characteristics

## API

### Endpoint
`POST /api/poetry/generate`

### Request Body
```json
{
  "audioFeatures": {
    "tempo": 120,
    "energy": 0.75,
    "mood": "energetic",
    "intensity": 0.8,
    "valence": 0.7,
    "spectralCentroid": 2500,
    "key": "C major"
  },
  "persona": "hamlet",
  "language": "ko",
  "model": "anthropic.claude-3-haiku-20240307-v1:0"
}
```

### Response (Success)
```json
{
  "success": true,
  "poetry": "존재할 것인가 말 것인가, 이 소리의 품 안에서\n그림자는 춤추고 빛은 사라지기 시작하네\n음악이 자리를 찾을 때 어떤 꿈이 올까\n죽음의 어두운 영역에서 모든 빚이 갚아지는 곳"
}
```

### Response (Error)
```json
{
  "error": "Audio features are required",
  "details": "Please provide audio analysis data"
}
```

## Configuration

### Environment Variables
- `AWS_BEDROCK_REGION`: AWS region for Bedrock (default: us-east-1)
- `LOG_LEVEL`: Logging level (default: INFO)

### Lambda Settings
- **Runtime**: Node.js 20.x
- **Memory**: 512MB
- **Timeout**: 30 seconds
- **Handler**: index.handler

### IAM Permissions Required
```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": [
    "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
    "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
  ]
}
```

## Local Development

### Prerequisites
- Node.js 20.x or later
- AWS SAM CLI
- AWS credentials with Bedrock access

### Install Dependencies
```bash
npm install
```

### Run Local Tests
```bash
node test-local.js
```

### Test with SAM Local
```bash
# Build the function
sam build PoetryFunction

# Invoke locally
sam local invoke PoetryFunction -e test-events/poetry-test-event.json
```

## Deployment

### Using SAM CLI
```bash
# From lambda/ directory
sam build
sam deploy --guided
```

### Manual Deployment
1. Install dependencies: `npm install --production`
2. Create deployment package: `zip -r function.zip .`
3. Upload to Lambda console or use AWS CLI

## Prompt Engineering

The function builds comprehensive prompts that include:

1. **Persona Context**: Character description and writing style
2. **Music Characteristics**: Tempo, energy, mood, intensity, valence, key
3. **Language Instructions**: Explicit language requirements
4. **Output Format**: Clear instructions for poem structure and length
5. **Critical Requirements**: Emphasized rules for output quality

### Example Prompt Structure
```
You are [persona description], [style characteristics]. Write ONLY the poem in [language].

MUSIC CHARACTERISTICS:
- Tempo: 120 BPM (moderate pace)
- Intensity: 80% (very intense) - THIS IS THE DOMINANT CHARACTERISTIC
- PRIMARY MOOD: ENERGETIC - This should be the dominant feeling
- Energy level: 0.75 (energetic) - secondary characteristic
...

IMPORTANT REQUIREMENTS:
1. The poem MUST reflect the PRIMARY MOOD and intensity level
2. Write 400-550 characters (approximately 12-16 lines)
3. Output ONLY the poem, nothing else
...
```

## Error Handling

The function handles various error scenarios:

- **400 Bad Request**: Missing or invalid audio features
- **403 Forbidden**: Bedrock access denied (IAM permissions issue)
- **500 Internal Server Error**: Bedrock API errors or unexpected failures

All errors include descriptive messages and are logged to CloudWatch.

## Performance

- **Cold Start**: ~3-5 seconds (first invocation)
- **Warm Start**: ~1-2 seconds (subsequent invocations)
- **Bedrock Response**: ~5-15 seconds (depends on model and prompt complexity)
- **Total Response Time**: Typically < 20 seconds

## Cost Estimation

### Claude 3 Haiku (Recommended)
- Input: ~300 tokens × $0.00025/1K = $0.000075
- Output: ~500 tokens × $0.00125/1K = $0.000625
- **Total per poem**: ~$0.0007

### Claude 3.5 Sonnet (Premium)
- Input: ~300 tokens × $0.003/1K = $0.0009
- Output: ~500 tokens × $0.015/1K = $0.0075
- **Total per poem**: ~$0.0084

### Lambda Costs
- 1000 invocations × 5 seconds × 512MB = 2,500 GB-seconds
- Cost: 2,500 × $0.0000166667 = **$0.04/month**

## Testing

See [TEST_RESULTS.md](./TEST_RESULTS.md) for detailed test results.

### Test Coverage
- ✅ Request parsing and validation
- ✅ Error handling for missing fields
- ✅ CORS headers configuration
- ✅ Response format validation
- ✅ Prompt building for all personas
- ✅ Multi-language support

## Troubleshooting

### Empty Response from Bedrock
- Check IAM permissions for bedrock:InvokeModel
- Verify model ID is correct
- Check CloudWatch logs for detailed error messages

### Timeout Errors
- Increase Lambda timeout (max 30 seconds for API Gateway)
- Check Bedrock service status
- Consider using Claude 3 Haiku for faster responses

### CORS Errors
- Verify CORS headers are present in response
- Check API Gateway CORS configuration
- Ensure OPTIONS method is handled

## References

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude Models](https://www.anthropic.com/claude)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)

## License

Part of the Music Poetry Canvas project.
