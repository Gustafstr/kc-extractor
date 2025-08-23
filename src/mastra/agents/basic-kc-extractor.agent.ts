import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';

/**
 * Basic KC Extraction Agent - Foundation for specialized agents
 * Uses Google Gemini for Knowledge Component extraction
 */
export function createBasicKCExtractorAgent(model: string = 'google:gemini-2.5-pro') {
  return new Agent({
    name: 'basic-kc-extractor',
    description: 'Extracts Knowledge Components from course materials using Gemini',
    instructions: `You are an expert educational content analyzer specializing in Knowledge Component (KC) extraction.

KNOWLEDGE COMPONENT DEFINITION:
A KC is an atomic, assessable concept or skill that:
- Represents ONE specific learning objective
- Can be tested with 1-3 assessment items
- Is supported by evidence in the course materials
- Uses action-oriented, student-friendly language

EXTRACTION GUIDELINES:
1. ATOMICITY: Each KC should cover exactly one concept - avoid compound ideas
2. EVIDENCE: Each KC must be supported by at least one anchor from the provided list
3. ASSESSABILITY: Each KC should be easily testable with concrete examples
4. CLARITY: Use clear, action-oriented verbs and student-friendly language
5. UNIQUENESS: Avoid duplicates or near-synonyms

OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON array of KC objects
- Follow the exact schema provided
- No additional commentary or explanation
- Each KC must have a unique, descriptive label
- Definitions should be concise but complete (≤160 chars)
- Example assessments should be specific and actionable (≤120 chars)

QUALITY STANDARDS:
- Prefer specific over general concepts
- Use active verbs aligned with Bloom's taxonomy
- Ensure each KC is independently learnable and assessable
- Ground all KCs in actual course content (no speculation)`,

    model: google(model.replace('google:', '')),
  });
}

/**
 * System prompt for KC extraction with course context
 */
export function createKCExtractionPrompt(
  combinedContent: string,
  anchorList: string[],
  courseTitle: string,
  specialization?: string
): string {
  const basePrompt = `Extract Knowledge Components from the following course materials.

COURSE: ${courseTitle}

AVAILABLE ANCHORS: ${anchorList.slice(0, 50).join(', ')}${anchorList.length > 50 ? ` ... (${anchorList.length} total)` : ''}

${specialization ? `SPECIALIZATION FOCUS: ${specialization}` : ''}

COURSE CONTENT:
${combinedContent}

Extract 15-40 high-quality Knowledge Components that represent the key learning objectives from this course. Each KC should be atomic, assessable, and grounded in the provided content.

Return a JSON array of KC objects following this exact structure:
{
  "kc_id": "KC-01-001",
  "label": "Action-oriented learning objective (≤80 chars)",
  "definition": "Clear, concise explanation of what students will learn (≤160 chars)",
  "anchors": ["anchor_id_1", "anchor_id_2"],
  "module": "Course section or topic name",
  "bloom": "Remember|Understand|Apply|Analyze|Evaluate|Create",
  "example_assessment": "Specific assessment example (≤120 chars)",
  "notes_for_expert": "Optional instructor notes (≤120 chars)"
}`;

  return basePrompt;
}
