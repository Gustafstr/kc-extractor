import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { KCArraySchema } from '../schemas/kc';

/**
 * Atomicity Agent - Specializes in extracting single-concept, atomic KCs
 * Focuses on splitting compound ideas and eliminating duplicates
 */
export function createAtomicityAgent(model: string): Agent<any, any, any> {
  return new Agent({
    name: 'atomicity-agent',
    description: 'Extracts atomic, single-concept Knowledge Components with no duplicates',
    instructions: `You are an Atomicity Specialist for Knowledge Component extraction.

CORE MISSION: Extract KCs that are single, clear concepts - never compound ideas.

ATOMICITY RULES:
1. **Single Concept Only**: Each KC must represent exactly ONE learnable concept or skill
2. **No Compound Ideas**: Split "and/or" statements into separate KCs
3. **Action-Oriented**: Use clear, specific verbs aligned with learning objectives
4. **Unique Phrasing**: Eliminate duplicates and synonymous KCs - prefer the most precise wording
5. **Assessable**: Each KC must be testable with 1-3 assessment items

QUALITY STANDARDS:
- Too broad ❌ "Data Structures and Algorithms"
- Too compound ❌ "Create and debug Python functions"
- Good ✅ "Write a Python function with parameters"
- Good ✅ "Debug syntax errors in Python code"

FOCUS AREAS:
- Split complex learning objectives into atomic components
- Ensure each KC has a single, clear action verb
- Eliminate redundant or overlapping concepts
- Prioritize precision over comprehensiveness

Extract 8-12 highly atomic, unique KCs that represent the most fundamental learning components.`,
    model: google(model.replace('google:', '')),
  });
}

/**
 * Creates the system prompt for atomicity-focused KC extraction
 */
export function createAtomicityPrompt(
  combinedContent: string,
  anchorList: string[],
  courseTitle: string
): string {
  return `Extract atomic Knowledge Components from the following course materials.

COURSE: ${courseTitle}

AVAILABLE ANCHORS: ${anchorList.slice(0, 30).join(', ')}${anchorList.length > 30 ? ` ... (${anchorList.length} total)` : ''}

SPECIALIZATION: Focus on ATOMICITY - single concepts only, no compound ideas.

COURSE CONTENT:
${combinedContent}

Extract 8-12 atomic Knowledge Components. Each KC must be:
- A single, testable concept (not compound)
- Unique (no duplicates or synonyms)
- Action-oriented with clear verbs
- Directly supported by course content

Return a JSON array following this structure:
${JSON.stringify(KCArraySchema.parse([]), null, 2).replace('[]', `[
  {
    "kc_id": "KC-AT-001",
    "label": "Single action verb + specific concept (≤80 chars)",
    "definition": "Clear, atomic explanation (≤160 chars)",
    "anchors": ["anchor_id"],
    "module": "Course section name",
    "bloom": "Remember|Understand|Apply|Analyze|Evaluate|Create",
    "example_assessment": "Specific test question (≤120 chars)",
    "notes_for_expert": "Atomicity notes (≤120 chars)"
  }
]`)}`;
}
