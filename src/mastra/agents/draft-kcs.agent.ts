import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';

function resolveModel(model: string) {
  const [provider, name] = model.split(':');
  if (provider === 'google') return google(name);
  throw new Error(`Unsupported model provider '${provider}'. Install the provider or use google:*`);
}

export function createDraftKCsAgent(model: string) {
  return new Agent({
    name: 'DraftKCsAgent',
    instructions: `You extract Knowledge Components (KCs) as a strict JSON array.\n- Output ONLY JSON, no prose.\n- Keep KCs atomic and assessable.\n- Fields: kc_id, label (<=80), definition (<=160), anchors (nonempty array), module, bloom (Remember|Understand|Apply|Analyze|Evaluate|Create), example_assessment (<=120).\n- If no reliable anchors are provided, use ["P-001"] as a placeholder.`,
    model: resolveModel(model),
  });
}

export function buildDraftPrompt(params: {
  combinedMd: string;
  anchorIndex: { id: string; quote: string }[];
  modules: string[];
}): string {
  const { combinedMd, anchorIndex, modules } = params;
  const anchorPreview = anchorIndex.map(a => `${a.id}: ${a.quote}`).join('\n');
  return `Extract 5–200 KCs across the whole course. Keep the most atomic candidates.\n\nReturn ONLY a valid JSON array of KC objects (no wrapper text).\n\nModules:\n${modules.join(', ')}\n\nAnchor Index (ID: excerpt):\n${anchorPreview}\n\nCombined Markdown:\n${combinedMd}`;
}


