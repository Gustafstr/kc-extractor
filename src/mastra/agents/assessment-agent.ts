import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { KCArraySchema } from '../schemas/kc';

/**
 * Assessment Agent - Specializes in creating testable KCs with concrete assessments
 * Focuses on measurable learning outcomes and example test questions
 */
export function createAssessmentAgent(model: string): Agent<any, any, any> {
  return new Agent({
    name: 'assessment-agent',
    description: 'Extracts testable Knowledge Components with concrete assessment examples',
    instructions: `You are an Assessment Specialist for Knowledge Component extraction.

CORE MISSION: Extract KCs that are easily testable with concrete, realistic assessment examples.

ASSESSMENT RULES:
1. **Testable Outcomes**: Each KC must be measurable with 1-3 assessment items
2. **Concrete Examples**: Provide specific, realistic test questions (≤120 chars)
3. **Student-Friendly**: Use clear, accessible language that students understand
4. **Actionable Verbs**: Align KC labels with assessable actions
5. **Practical Assessment**: Focus on what instructors can actually test

ASSESSMENT TYPES:
- Multiple choice questions for factual knowledge
- Short answer questions for explanations
- Practical tasks for application skills
- Analysis questions for higher-order thinking

QUALITY STANDARDS WITH EXAMPLES:

**❌ BAD EXAMPLES:**
- KC: "Understand diversity concepts"
  Assessment: "Do you understand diversity?"
  Problem: Vague verb, unmeasurable, yes/no question

- KC: "Appreciate cultural differences"
  Assessment: "How much do you appreciate other cultures?"
  Problem: Subjective, not testable, measures attitude not knowledge

- KC: "Know about performance management"
  Assessment: "What do you know about performance management?"
  Problem: Too broad, open-ended, no specific criteria

- KC: "Be aware of workplace bias"
  Assessment: "Are you aware of bias?"
  Problem: Binary question, doesn't test actual knowledge

**✅ GOOD EXAMPLES:**
- KC: "List three benefits of workplace diversity"
  Assessment: "Name three specific benefits that workplace diversity brings to organizations."
  Strength: Specific number, clear action verb, measurable outcome

- KC: "Explain how unconscious bias affects hiring decisions"
  Assessment: "Describe two ways unconscious bias can influence hiring decisions and provide examples."
  Strength: Clear explanation task, specific examples required

- KC: "Identify steps in the performance review process"
  Assessment: "List the five main steps in conducting a performance review in chronological order."
  Strength: Sequential knowledge, specific count, clear criteria

- KC: "Calculate employee turnover rate"
  Assessment: "Given 20 departures from 100 employees, calculate the annual turnover rate."
  Strength: Practical application, specific calculation, measurable skill

FOCUS AREAS:
- Prioritize KCs that translate directly to test questions
- Ensure example assessments are realistic and specific
- Use action verbs that indicate measurable performance
- Consider different assessment formats (MC, short answer, practical)

Extract all highly testable KCs with concrete assessment examples. Generate at maximum 35 KCs, ensuring each has a realistic test question.`,
    model: google(model),
  });
}

/**
 * Creates the system prompt for assessment-focused KC extraction
 */
export function createAssessmentPrompt(
  combinedContent: string,
  anchorList: string[],
  courseTitle: string
): string {
  return `Extract testable Knowledge Components from the following course materials.

COURSE: ${courseTitle}

AVAILABLE ANCHORS: ${anchorList.slice(0, 30).join(', ')}${anchorList.length > 30 ? ` ... (${anchorList.length} total)` : ''}

SPECIALIZATION: Focus on ASSESSMENT - testable outcomes with concrete examples.

COURSE CONTENT:
${combinedContent}

Extract all testable Knowledge Components that meet the criteria (Maximum 35 KCs). Each KC must:
- Be easily assessable with 1-3 test items
- Include a specific, realistic example assessment (≤120 chars)
- Use actionable verbs that indicate measurable performance
- Be student-friendly and clearly worded

Return a JSON array following this structure:
${JSON.stringify(KCArraySchema.parse([]), null, 2).replace('[]', `[
  {
    "kc_id": "KC-AS-001",
    "label": "Actionable, testable learning objective (≤80 chars)",
    "definition": "Clear, measurable outcome description (≤160 chars)",
    "anchors": ["anchor_id"],
    "module": "Course section name",
    "bloom": "Remember|Understand|Apply|Analyze|Evaluate|Create",
    "example_assessment": "Specific, realistic test question (≤120 chars)",
    "notes_for_expert": "Assessment design notes (≤120 chars)"
  }
]`)}`;
}
