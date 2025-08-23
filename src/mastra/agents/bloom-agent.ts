import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { KCArraySchema } from '../schemas/kc';

/**
 * Bloom Agent - Specializes in proper Bloom's Taxonomy classification
 * Ensures accurate cognitive level mapping and verb alignment
 */
export function createBloomAgent(model: string): Agent<any, any, any> {
  return new Agent({
    name: 'bloom-agent',
    description: 'Extracts Knowledge Components with accurate Bloom taxonomy classification',
    instructions: `You are a Taxonomy Specialist for Knowledge Component extraction.

CORE MISSION: Extract KCs with precise Bloom's Taxonomy level mapping and appropriate verb alignment.

BLOOM'S TAXONOMY LEVELS:
1. **Remember**: Recall facts, terms, concepts (list, identify, define, name)
2. **Understand**: Explain ideas, summarize, interpret (explain, describe, summarize, compare)
3. **Apply**: Use knowledge in new situations (apply, demonstrate, use, implement)
4. **Analyze**: Break down information, examine relationships (analyze, examine, compare, contrast)
5. **Evaluate**: Make judgments, critique, assess (evaluate, critique, judge, assess)
6. **Create**: Produce new work, synthesize ideas (create, design, develop, construct)

VERB ALIGNMENT RULES:
- KC label verb MUST match the Bloom level
- Use specific, measurable action verbs
- Avoid vague verbs like "know" or "understand" in labels
- Ensure cognitive complexity matches the course level

QUALITY STANDARDS WITH EXAMPLES:

**❌ BAD EXAMPLES:**
- KC: "List diversity benefits" → Classified as Analyze
  Problem: Listing is a Remember activity, not analysis

- KC: "Create a definition of bias" → Classified as Remember  
  Problem: Creating requires synthesis, should be Create level

- KC: "Know performance metrics" → Classified as Apply
  Problem: "Know" is vague, not actionable, wrong level

- KC: "Understand conflict resolution" → Classified as Evaluate
  Problem: "Understand" typically maps to Understand level, not Evaluate

- KC: "Think about diversity" → Classified as Analyze
  Problem: "Think" is too vague, not measurable

**✅ GOOD EXAMPLES:**
- KC: "Define workplace diversity" → Remember
  Strength: "Define" aligns with Remember (recall factual knowledge)

- KC: "Explain the benefits of diversity" → Understand  
  Strength: "Explain" requires comprehension and interpretation

- KC: "Apply conflict resolution techniques in scenarios" → Apply
  Strength: "Apply" uses knowledge in new situations

- KC: "Analyze the effectiveness of hiring practices" → Analyze
  Strength: "Analyze" breaks down and examines components

- KC: "Evaluate the success of diversity initiatives" → Evaluate
  Strength: "Evaluate" makes judgments based on criteria

- KC: "Design an inclusive workplace policy" → Create
  Strength: "Design" synthesizes elements into new structure

FOCUS AREAS:
- Ensure verb-taxonomy alignment is precise
- Consider appropriate complexity for course level
- Create a balanced distribution across Bloom levels
- Prioritize higher-order thinking when content supports it

Extract all KCs with accurate Bloom taxonomy classification and verb alignment. Generate as many properly classified KCs as needed to cover the course content across appropriate cognitive levels.`,
    model: google(model.replace('google:', '')),
  });
}

/**
 * Creates the system prompt for Bloom-focused KC extraction
 */
export function createBloomPrompt(
  combinedContent: string,
  anchorList: string[],
  courseTitle: string
): string {
  return `Extract Knowledge Components with accurate Bloom taxonomy from the following course materials.

COURSE: ${courseTitle}

AVAILABLE ANCHORS: ${anchorList.slice(0, 30).join(', ')}${anchorList.length > 30 ? ` ... (${anchorList.length} total)` : ''}

SPECIALIZATION: Focus on BLOOM'S TAXONOMY - accurate cognitive level mapping.

BLOOM LEVEL REFERENCE:
- Remember: list, identify, define, name, recall
- Understand: explain, describe, summarize, interpret, compare
- Apply: apply, demonstrate, use, implement, execute
- Analyze: analyze, examine, compare, contrast, differentiate
- Evaluate: evaluate, critique, judge, assess, justify
- Create: create, design, develop, construct, formulate

COURSE CONTENT:
${combinedContent}

Extract all Knowledge Components with precise Bloom classification. Each KC must:
- Use action verbs that align with the assigned Bloom level
- Have cognitive complexity appropriate for the course
- Show accurate verb-taxonomy mapping
- Represent a balanced distribution across Bloom levels when possible

Generate as many properly classified KCs as needed for comprehensive cognitive coverage.

Return a JSON array following this structure:
${JSON.stringify(KCArraySchema.parse([]), null, 2).replace('[]', `[
  {
    "kc_id": "KC-BL-001",
    "label": "Bloom-aligned verb + concept (≤80 chars)",
    "definition": "Clear explanation matching cognitive level (≤160 chars)",
    "anchors": ["anchor_id"],
    "module": "Course section name",
    "bloom": "Remember|Understand|Apply|Analyze|Evaluate|Create",
    "example_assessment": "Assessment matching Bloom level (≤120 chars)",
    "notes_for_expert": "Taxonomy alignment notes (≤120 chars)"
  }
]`)}`;
}
