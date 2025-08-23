import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { KCArraySchema } from '../schemas/kc';

/**
 * Anchors Agent - Specializes in evidence-based KC extraction
 * Ensures every KC is strongly supported by course content anchors
 */
export function createAnchorsAgent(model: string): Agent<any, any, any> {
  return new Agent({
    name: 'anchors-agent',
    description: 'Extracts Knowledge Components with strong anchor evidence support',
    instructions: `You are an Evidence Specialist for Knowledge Component extraction.

CORE MISSION: Extract KCs that are directly and strongly supported by course content anchors.

EVIDENCE RULES:
1. **Strong Anchor Support**: Each KC must cite 1-2 anchors that directly support the concept
2. **Direct Evidence**: Anchors must contain explicit content about the KC - no inference
3. **Traceable**: Every KC claim must be traceable to specific text in the anchors
4. **No Speculation**: Never create KCs based on implied or inferred knowledge
5. **Anchor Validation**: Only use anchor IDs from the provided list

QUALITY STANDARDS:
- Strong ✅ KC cites anchor that explicitly explains the concept
- Weak ❌ KC cites anchor that only mentions the topic tangentially
- Invalid ❌ KC uses anchor IDs not in the provided list

EVIDENCE ASSESSMENT:
- Does the anchor text directly explain this concept?
- Can a student learn this KC from the cited anchor content?
- Is the connection between KC and anchor explicit and clear?

FOCUS AREAS:
- Prioritize KCs with the strongest textual evidence
- Ensure anchor content directly supports the KC definition
- Prefer fewer, well-supported KCs over many weakly-supported ones
- Validate all anchor IDs against the provided list

Extract 8-12 evidence-based KCs with the strongest possible anchor support.`,
    model: google(model.replace('google:', '')),
  });
}

/**
 * Creates the system prompt for anchor-focused KC extraction
 */
export function createAnchorsPrompt(
  combinedContent: string,
  anchorList: string[],
  courseTitle: string
): string {
  return `Extract evidence-based Knowledge Components from the following course materials.

COURSE: ${courseTitle}

AVAILABLE ANCHORS: ${anchorList.join(', ')}

SPECIALIZATION: Focus on EVIDENCE - strong anchor support for every KC.

COURSE CONTENT:
${combinedContent}

Extract 8-12 evidence-based Knowledge Components. Each KC must:
- Cite 1-2 anchors that DIRECTLY support the concept
- Be traceable to explicit content in the cited anchors
- Use only anchor IDs from the provided list above
- Have clear, direct evidence (no inference or speculation)

Return a JSON array following this structure:
${JSON.stringify(KCArraySchema.parse([]), null, 2).replace('[]', `[
  {
    "kc_id": "KC-AN-001",
    "label": "Evidence-supported learning objective (≤80 chars)",
    "definition": "Clear explanation directly supported by anchors (≤160 chars)",
    "anchors": ["anchor_id_with_direct_evidence"],
    "module": "Course section name",
    "bloom": "Remember|Understand|Apply|Analyze|Evaluate|Create",
    "example_assessment": "Test question based on anchor content (≤120 chars)",
    "notes_for_expert": "Evidence strength notes (≤120 chars)"
  }
]`)}`;
}
