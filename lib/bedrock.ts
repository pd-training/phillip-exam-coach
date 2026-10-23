// Minimal client for Amazon Bedrock's Converse API, authenticated with a bearer token.
// Config comes from environment variables (see .env.example).

export class BedrockError extends Error {}

export async function invokeBedrockText(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  // BEDROCK_API_KEY is used on Amplify (AWS_ names are reserved there)
  const token = process.env.BEDROCK_API_KEY || process.env.AWS_BEARER_TOKEN_BEDROCK;
  const region = process.env.BEDROCK_REGION || "ap-southeast-2";
  const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

  if (!token) {
    const seen = Object.keys(process.env).filter((k) => /BEDROCK|AWS/i.test(k));
    throw new BedrockError(
      `BEDROCK_API_KEY is not set (server can see: ${seen.join(", ") || "none"})`
    );
  }

  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(
    modelId
  )}/converse`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      system: [{ text: opts.system }],
      messages: [{ role: "user", content: [{ text: opts.user }] }],
      inferenceConfig: { maxTokens: opts.maxTokens ?? 600, temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new BedrockError(`Bedrock returned ${res.status}: ${body.slice(0, 200)}`);
  }

  const data: any = await res.json();
  const text = data?.output?.message?.content?.find((c: any) => typeof c.text === "string")?.text;
  if (!text) throw new BedrockError("Bedrock response had no text");
  return text;
}
