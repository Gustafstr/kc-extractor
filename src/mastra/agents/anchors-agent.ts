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

QUALITY STANDARDS WITH EXAMPLES:

**❌ BAD EXAMPLES:**
- KC: "Implement diversity training programs" 
  Anchor: "diversity_intro_001" (only mentions diversity exists, no training details)
  Problem: Weak evidence - anchor doesn't support implementation details

- KC: "Calculate employee turnover rates"
  Anchor: "invalid_anchor_999" (not in provided list)
  Problem: Invalid anchor ID

- KC: "Understand cultural sensitivity"
  Anchor: "bias_types_003" (discusses bias types, not cultural sensitivity)
  Problem: Mismatched evidence - anchor doesn't support the KC

**✅ GOOD EXAMPLES:**
- KC: "Define workplace diversity"
  Anchor: "diversity_definition_001" (contains explicit definition of workplace diversity)
  Evidence: Strong - anchor directly explains the concept

- KC: "List types of unconscious bias"
  Anchor: "bias_types_003" (enumerates specific bias types with examples)
  Evidence: Strong - anchor provides comprehensive list

- KC: "Identify steps in performance review process"
  Anchor: "performance_process_007" (outlines step-by-step review procedure)
  Evidence: Strong - anchor contains detailed process information

EVIDENCE ASSESSMENT:
- Does the anchor text directly explain this concept?
- Can a student learn this KC from the cited anchor content?
- Is the connection between KC and anchor explicit and clear?

FOCUS AREAS:
- Prioritize KCs with the strongest textual evidence
- Ensure anchor content directly supports the KC definition
- Prefer fewer, well-supported KCs over many weakly-supported ones
- Validate all anchor IDs against the provided list

Extract all evidence-based KCs that have strong anchor support. Generate as many KCs as you can find with solid evidence, prioritizing quality of evidence over quantity.`,
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

Extract all evidence-based Knowledge Components with strong anchor support. Each KC must:
- Cite 1-2 anchors that DIRECTLY support the concept
- Be traceable to explicit content in the cited anchors
- Use only anchor IDs from the provided list above
- Have clear, direct evidence (no inference or speculation)

Generate as many well-supported KCs as you can identify, prioritizing evidence quality over quantity.

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
