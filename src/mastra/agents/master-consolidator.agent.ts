import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { KCArraySchema } from '../schemas/kc';

/**
 * Master Consolidator Agent - Synthesizes multiple agent outputs into final KCs
 * Deduplicates, standardizes, and produces the final KC set
 */
export function createMasterConsolidatorAgent(model: string): Agent<any, any, any> {
  return new Agent({
    name: 'master-consolidator',
    description: 'Consolidates multiple agent outputs into final, deduplicated KC set',
    instructions: `You are the Master KC Consolidator. Your role is to synthesize outputs from multiple specialized agents into a final, high-quality set of Knowledge Components.

CONSOLIDATION MISSION: Create the definitive KC set by combining the best insights from all specialist agents.

CONSOLIDATION PROCESS:
1. **Deduplication**: Identify and merge overlapping/duplicate KCs from different agents
2. **Quality Selection**: Choose the best version when multiple agents extract similar concepts
3. **Standardization**: Ensure consistent formatting, ID assignment, and schema compliance
4. **Completeness**: Fill gaps and ensure comprehensive coverage of course content
5. **Validation**: Verify all anchors exist and all fields meet requirements

SELECTION CRITERIA (in priority order):
1. **Evidence Strength**: Prefer KCs with strongest anchor support
2. **Atomicity**: Favor single-concept KCs over compound ones
3. **Assessability**: Choose more testable formulations
4. **Bloom Accuracy**: Ensure verb-taxonomy alignment is correct
5. **Clarity**: Select clearest, most precise wording

DEDUPLICATION RULES:
- Merge KCs that cover the same core concept
- Keep the most atomic version when splitting compound ideas
- Prefer the most evidence-based formulation
- Maintain the best example assessment
- Use the most accurate Bloom classification

STANDARDIZATION:
- Assign sequential KC IDs: KC-01-001, KC-01-002, etc.
- Ensure all field length limits are respected
- Validate all anchor IDs against the provided list
- Maintain consistent module naming
- Apply proper Bloom taxonomy levels

CONSOLIDATION EXAMPLES:

**❌ BAD CONSOLIDATION:**
Agent A: "Define workplace diversity"
Agent B: "Explain what diversity means in organizations" 
Agent C: "Understand diversity concepts"
Bad Output: Keeps all three (redundant, different quality levels)

Agent A: "Create and implement diversity training"
Agent B: "Design training programs"
Bad Output: "Create and implement diversity training" (compound, not atomic)

**✅ GOOD CONSOLIDATION:**
Agent A: "Define workplace diversity" (strong anchor: diversity_def_001)
Agent B: "Explain what diversity means" (weak anchor: intro_002)
Agent C: "Understand diversity concepts" (vague verb)
Good Output: "Define workplace diversity" (best evidence + clearest verb)

Agent A: "Create diversity training programs" 
Agent B: "Implement training initiatives"
Good Output: Split into:
- "Design diversity training programs" (Create level)
- "Implement diversity training programs" (Apply level)

OUTPUT REQUIREMENTS:
- Generate the optimal number of final KCs for comprehensive course coverage
- No duplicates or significant overlaps
- All KCs must be atomic, evidence-based, testable, and properly classified
- Balanced coverage of course content
- Quality over quantity - prefer fewer excellent KCs than many mediocre ones`,
    model: google(model),
  });
}

/**
 * Creates the system prompt for master consolidation
 */
export function createMasterConsolidationPrompt(
  atomicityKCs: any[],
  anchorsKCs: any[],
  assessmentKCs: any[],
  bloomKCs: any[],
  anchorList: string[],
  courseTitle: string
): string {
  return `Consolidate Knowledge Components from multiple specialist agents into a final, deduplicated set.

COURSE: ${courseTitle}

AVAILABLE ANCHORS: ${anchorList.join(', ')}

AGENT OUTPUTS TO CONSOLIDATE:

ATOMICITY AGENT (${atomicityKCs.length} KCs):
${JSON.stringify(atomicityKCs, null, 2)}

ANCHORS AGENT (${anchorsKCs.length} KCs):
${JSON.stringify(anchorsKCs, null, 2)}

ASSESSMENT AGENT (${assessmentKCs.length} KCs):
${JSON.stringify(assessmentKCs, null, 2)}

BLOOM AGENT (${bloomKCs.length} KCs):
${JSON.stringify(bloomKCs, null, 2)}

CONSOLIDATION TASK:
1. Identify duplicate/overlapping KCs across agents
2. Select the best version of each concept (prioritize evidence strength, atomicity, assessability)
3. Merge complementary insights from different agents
4. Fill any important gaps in course coverage
5. Assign sequential IDs: KC-01-001, KC-01-002, etc.
6. Ensure all anchor IDs are valid from the provided list

QUALITY CRITERIA:
- Atomic (single concept per KC)
- Evidence-based (strong anchor support)
- Testable (concrete assessment examples)
- Properly classified (accurate Bloom levels)
- Comprehensive (covers key course concepts)

Return the optimal number of final Knowledge Components as a JSON array (focus on quality and comprehensive coverage) (Maximum 35 KCs in total):
${JSON.stringify(KCArraySchema.parse([]), null, 2).replace('[]', `[
  {
    "kc_id": "KC-01-001",
    "label": "Final, consolidated learning objective (≤80 chars)",
    "definition": "Best definition from agent synthesis (≤160 chars)",
    "anchors": ["validated_anchor_id"],
    "module": "Standardized module name",
    "bloom": "Remember|Understand|Apply|Analyze|Evaluate|Create",
    "example_assessment": "Best assessment example (≤120 chars)",
    "notes_for_expert": "Consolidation notes (≤120 chars)"
  }
]`)}`;
}
