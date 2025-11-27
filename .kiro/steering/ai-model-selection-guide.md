# AI Model Selection Guide for Music Poetry Canvas

This document provides guidance on selecting the appropriate AI model for poetry generation and visualization configuration in the Music Poetry Canvas project.

## Quick Decision Matrix

| Use Case | Recommended Model | Alternative | Reason |
|----------|------------------|-------------|---------|
| **Development (Local)** | Gemma3:4b | Mistral 7B | Fast, consistent, no thinking overhead |
| **Production (Cloud)** | Claude 3 Haiku (Bedrock) | GPT-4o-mini (OpenAI) | Best quality/cost ratio |
| **Korean Poetry** | Claude 3.5 Sonnet | GPT-4 | Excellent multilingual support |
| **Creative Poetry** | GPT-4 | Claude 3 Opus | Most creative output |
| **Budget-Conscious** | Gemma3:4b (Local) | Claude 3 Haiku | Free (local) or lowest cost |
| **JSON Generation** | Gemma3:4b | Claude 3 Haiku | Structured output, low temperature |

## Model Comparison

### Local Models (Ollama)

#### ✅ Gemma3:4b (Recommended for Development)

**Pros:**
- Fast inference on RTX 3060 (12GB VRAM)
- Consistent output format
- No thinking overhead (direct generation)
- Free to use
- Good at following instructions
- Decent Korean language support

**Cons:**
- May generate shorter outputs than requested
- Less creative than larger models
- Requires explicit length instructions

**Best For:**
- Development and testing
- JSON configuration generation
- Budget-conscious production
- When speed matters more than creativity

**Configuration:**
```typescript
{
  provider: 'ollama',
  model: 'gemma3:4b',
  temperature: 0.7,  // Poetry
  maxTokens: 1500,   // Long poems
}
```

**Tips:**
- Use explicit length requirements in prompts
- Provide concrete examples
- Lower temperature (0.3) for JSON output
- Works well with structured templates

---

#### ⚠️ Qwen3:4b (Use with Caution)

**Pros:**
- Advanced reasoning capabilities
- Can handle complex instructions
- Good multilingual support

**Cons:**
- **Thinking overhead**: Spends tokens on internal reasoning
- **Empty responses**: May return empty string after thinking
- **Unpredictable**: Token usage varies greatly
- Requires much higher token limits

**Best For:**
- Complex reasoning tasks (not poetry)
- When you need step-by-step thinking

**Configuration:**
```typescript
{
  provider: 'ollama',
  model: 'qwen3:4b',
  temperature: 0.7,
  maxTokens: 2000,  // Much higher for thinking overhead
}
```

**Tips:**
- Add "No thinking process, output only" to prompts
- Increase token limits by 2-3x
- Always have fallback templates ready
- Consider using Gemma3 instead

---

#### ✅ Mistral 7B (Good Alternative)

**Pros:**
- Excellent instruction following
- Good balance of speed and quality
- No thinking overhead
- Strong multilingual support

**Cons:**
- Requires more VRAM (16GB recommended)
- Slower than Gemma3:4b
- May be overkill for simple tasks

**Best For:**
- When you need better quality than Gemma3
- Complex poetry with multiple requirements
- When VRAM is not a constraint

**Configuration:**
```typescript
{
  provider: 'ollama',
  model: 'mistral:7b',
  temperature: 0.8,  // Slightly higher for creativity
  maxTokens: 1500,
}
```

---

### Cloud Models

#### ✅ Claude 3 Haiku (Bedrock) - Recommended for Production

**Pros:**
- **Best cost/performance ratio** for production
- Excellent instruction following
- Very good Korean language support
- Fast response times
- Consistent output quality
- Good at structured output (JSON)

**Cons:**
- Requires AWS account and credentials
- Pay per token (but very affordable)
- Slight latency compared to local

**Cost:** ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens

**Best For:**
- Production deployments
- When quality matters more than cost
- Korean poetry generation
- Reliable JSON generation

**Configuration:**
```typescript
{
  provider: 'bedrock',
  model: 'anthropic.claude-3-haiku-20240307-v1:0',
  region: 'us-east-1',
  temperature: 0.7,
  maxTokens: 1000,
}
```

**Tips:**
- Use for production after testing locally
- Set up AWS credentials properly
- Monitor costs with CloudWatch
- Cache common prompts if possible

---

#### ⭐ Claude 3.5 Sonnet (Bedrock) - Best Quality

**Pros:**
- **Best overall quality** for poetry
- Exceptional Korean language support
- Highly creative and nuanced
- Excellent at following complex instructions
- Great at maintaining persona consistency

**Cons:**
- Higher cost than Haiku
- Slower than Haiku
- May be overkill for simple tasks

**Cost:** ~$3 per 1M input tokens, ~$15 per 1M output tokens

**Best For:**
- Premium poetry generation
- When quality is paramount
- Complex persona embodiment
- Korean literary poetry

**Configuration:**
```typescript
{
  provider: 'bedrock',
  model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  region: 'us-east-1',
  temperature: 0.8,  // Higher for creativity
  maxTokens: 1000,
}
```

---

#### ✅ GPT-4o-mini (OpenAI) - Good Alternative

**Pros:**
- Good quality/cost ratio
- Fast response times
- Excellent at creative tasks
- Good Korean support
- Easy to set up (just API key)

**Cons:**
- Requires OpenAI API key
- Rate limits on free tier
- Slightly more expensive than Claude Haiku

**Cost:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens

**Best For:**
- When you prefer OpenAI ecosystem
- Quick prototyping
- When AWS setup is too complex

**Configuration:**
```typescript
{
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  maxTokens: 1000,
}
```

---

#### ⭐ GPT-4 (OpenAI) - Most Creative

**Pros:**
- **Most creative** poetry generation
- Excellent at complex instructions
- Best at maintaining consistent style
- Superior Korean language understanding

**Cons:**
- Expensive ($10-30 per 1M tokens)
- Slower than smaller models
- Overkill for most use cases

**Best For:**
- Premium creative content
- When budget is not a concern
- Showcasing best possible output

**Configuration:**
```typescript
{
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.9,  // Maximum creativity
  maxTokens: 1000,
}
```

---

## Task-Specific Recommendations

### Poetry Generation

#### Development/Testing
```typescript
// Best: Fast iteration, free
model: 'gemma3:4b'
temperature: 0.7
maxTokens: 1500
```

#### Production (Budget)
```typescript
// Best cost/quality for production
model: 'anthropic.claude-3-haiku-20240307-v1:0'
temperature: 0.7
maxTokens: 1000
```

#### Production (Premium)
```typescript
// Best quality
model: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
temperature: 0.8
maxTokens: 1000
```

### Visualization Configuration (JSON)

#### Development/Testing
```typescript
// Best: Fast, consistent JSON
model: 'gemma3:4b'
temperature: 0.3  // Low for structured output
maxTokens: 800
```

#### Production
```typescript
// Reliable JSON generation
model: 'anthropic.claude-3-haiku-20240307-v1:0'
temperature: 0.3
maxTokens: 800
```

### Korean Poetry (Specific)

#### Best Quality
```typescript
model: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
temperature: 0.8
maxTokens: 1000
```

#### Good Quality, Lower Cost
```typescript
model: 'anthropic.claude-3-haiku-20240307-v1:0'
temperature: 0.7
maxTokens: 1000
```

#### Local/Free
```typescript
model: 'gemma3:4b'
temperature: 0.7
maxTokens: 1500  // Higher for Korean characters
```

---

## Model Selection Flowchart

```
START
  ↓
Is this for production?
  ├─ NO → Use Gemma3:4b (local, free, fast)
  │
  └─ YES → What's your priority?
      ├─ Cost → Claude 3 Haiku (Bedrock)
      ├─ Quality → Claude 3.5 Sonnet (Bedrock)
      └─ Simplicity → GPT-4o-mini (OpenAI)
```

---

## Hardware Requirements

### Local Models (Ollama)

| Model | VRAM | RAM | Speed (RTX 3060) |
|-------|------|-----|------------------|
| Gemma3:4b | 6GB | 8GB | ~50 tokens/sec |
| Qwen3:4b | 6GB | 8GB | ~40 tokens/sec |
| Mistral 7B | 12GB | 16GB | ~30 tokens/sec |

**Minimum for Development:**
- GPU: RTX 3060 (12GB VRAM) or equivalent
- RAM: 16GB
- Storage: 10GB for models

---

## Cost Comparison (1000 Poems)

Assuming average poem = 500 tokens output, 300 tokens input:

| Model | Input Cost | Output Cost | Total |
|-------|-----------|-------------|-------|
| Gemma3:4b (Local) | $0 | $0 | **$0** |
| Claude 3 Haiku | $0.08 | $0.63 | **$0.71** |
| Claude 3.5 Sonnet | $0.90 | $7.50 | **$8.40** |
| GPT-4o-mini | $0.05 | $0.30 | **$0.35** |
| GPT-4 | $3.00 | $15.00 | **$18.00** |

**Recommendation:** Start with Gemma3:4b for development, switch to Claude 3 Haiku for production.

---

## Common Issues & Solutions

### Issue: Empty Responses (Qwen3)

**Problem:** Model returns empty string after thinking
**Solution:** 
1. Switch to Gemma3:4b or Mistral
2. If must use Qwen3: Increase maxTokens to 2000+
3. Add "No thinking, output only" to prompts

### Issue: Short Poems (Gemma3)

**Problem:** Generates 40-100 characters instead of 400-500
**Solution:**
1. Add explicit length: "Write 400-550 characters"
2. Provide example of desired length
3. Use "Do not write short poems" instruction
4. Ensure fallback templates are ready

### Issue: Poor Korean Quality (Local Models)

**Problem:** Korean poetry lacks nuance or has errors
**Solution:**
1. Switch to Claude 3 Haiku (best Korean support)
2. Provide more Korean examples in prompt
3. Use persona templates with Korean examples
4. Consider GPT-4o-mini as alternative

### Issue: JSON Parsing Errors

**Problem:** AI returns malformed JSON or adds text
**Solution:**
1. Use Gemma3:4b with temperature 0.3
2. Add "Output ONLY valid JSON" to prompt
3. Use regex to extract JSON: `/\{[\s\S]*\}/`
4. Validate and provide fallback config

---

## Testing Recommendations

### Before Deploying a New Model

1. **Test with contradictory features:**
   ```typescript
   { energy: 0.17, intensity: 0.84, mood: 'upbeat' }
   ```
   Expected: Should prioritize mood and intensity

2. **Test length compliance:**
   - Check if output meets 400-550 character requirement
   - Test with different style.length settings

3. **Test Korean output:**
   - Verify proper Korean grammar
   - Check character encoding
   - Ensure no English mixing (unless intended)

4. **Test JSON generation:**
   - Verify valid JSON structure
   - Check all required fields present
   - Validate value ranges

5. **Test fallback behavior:**
   - Simulate empty responses
   - Simulate malformed output
   - Verify fallback templates work

---

## Environment Configuration

### Development (.env.development)
```bash
AI_PROVIDER=ollama
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

### Production (.env.production)
```bash
# Option 1: AWS Bedrock (Recommended)
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Option 2: OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## Migration Path

### Phase 1: Development (Current)
- Use Gemma3:4b locally
- Test all features
- Refine prompts

### Phase 2: Beta Testing
- Switch to Claude 3 Haiku
- Monitor costs
- Gather user feedback

### Phase 3: Production
- Use Claude 3 Haiku for standard users
- Offer Claude 3.5 Sonnet as premium option
- Keep Gemma3:4b as free tier

---

## Monitoring & Optimization

### Metrics to Track

1. **Response Time**
   - Target: < 5 seconds for poetry
   - Target: < 2 seconds for JSON config

2. **Success Rate**
   - Target: > 95% valid responses
   - Track fallback usage rate

3. **Cost per Poem**
   - Monitor token usage
   - Optimize prompts to reduce tokens

4. **User Satisfaction**
   - Track poem ratings
   - Monitor regeneration requests

### Optimization Tips

1. **Reduce Token Usage:**
   - Remove unnecessary prompt text
   - Use shorter examples
   - Cache common prompts

2. **Improve Quality:**
   - A/B test different models
   - Refine persona templates
   - Collect user feedback

3. **Balance Cost/Quality:**
   - Use Haiku for most requests
   - Use Sonnet for premium users
   - Use local models for previews

---

## References

- Ollama Models: https://ollama.ai/library
- AWS Bedrock Pricing: https://aws.amazon.com/bedrock/pricing/
- OpenAI Pricing: https://openai.com/pricing
- Model Comparison: `src/services/AIProviderFactory.ts`
- Configuration: `src/config/config.ts`

---

**Last Updated**: 2025-11-27
**Maintainer**: Development Team
