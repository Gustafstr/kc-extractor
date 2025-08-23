# Knowledge Component Extraction System - Master Thesis Documentation

## 📖 **Executive Summary**

This document serves as comprehensive technical documentation for a **Knowledge Component (KC) Extraction System** built using the **Mastra framework** and **Google Gemini LLM**. The system demonstrates advanced AI workflow orchestration, multi-agent collaboration, and quality evaluation patterns through a pedagogical implementation approach.

**Research Context**: This implementation explores how modern AI frameworks can be used to automate educational content analysis, specifically the extraction of atomic learning objectives (Knowledge Components) from course materials. The work contributes to the intersection of AI-assisted education technology and workflow orchestration frameworks.

## 🎯 **Research Objectives & Motivation**

### **Primary Research Question**

_How can multi-agent LLM workflows be designed to extract high-quality, instructor-ready Knowledge Components from educational content while maintaining pedagogical validity and technical robustness?_

### **Secondary Objectives**

1. **Framework Evaluation**: Assess Mastra's capabilities for complex AI workflow orchestration
2. **Multi-Agent Design**: Explore agent specialization patterns for educational content analysis
3. **Quality Assurance**: Implement comprehensive evaluation metrics for AI-generated educational content
4. **Pedagogical Approach**: Document learning patterns for AI framework adoption

### **Why Knowledge Components?**

Knowledge Components represent the atomic units of learning - specific, measurable skills or concepts that students must master. Automating their extraction from course materials addresses a critical need in educational technology:

- **Scalability**: Manual KC extraction is time-intensive for large courses
- **Consistency**: Human extractors often produce inconsistent granularity and quality
- **Standardization**: Automated systems can enforce pedagogical best practices
- **Traceability**: AI systems can maintain evidence links to source materials

## 🏗️ **System Architecture & Design Philosophy**

### **Architectural Principles**

1. **Pedagogical Progression**: Implementation follows a learning-oriented approach, introducing Mastra concepts incrementally
2. **Agent Specialization**: Each AI agent focuses on a specific aspect of KC quality (atomicity, evidence, assessment, taxonomy)
3. **Quality-First Design**: Multiple evaluation layers ensure educational validity
4. **Framework Demonstration**: Showcases Mastra's key patterns through practical application

### **High-Level Architecture**

```mermaid
graph TD
    A[Course Materials] --> B[Course Loader Tool]
    B --> C[Parallel Agent Processing]
    C --> D[Atomicity Agent]
    C --> E[Anchors Agent]
    C --> F[Assessment Agent]
    C --> G[Bloom Agent]
    D --> H[Master Consolidator]
    E --> H
    F --> H
    G --> H
    H --> I[Quality Evaluation]
    I --> J[Final KCs + Metrics]
```

### **Data Flow Design**

The system implements a **typed data pipeline** using Zod schemas to ensure type safety and data integrity throughout the workflow:

```typescript
CourseFiles → CombinedContent → AgentOutputs → ConsolidatedKCs → EvaluatedKCs → FinalOutput
```

Each transformation is validated against strict schemas, preventing data corruption and enabling reliable error handling.

## 📋 **Detailed Workflow Steps**

### **Step 1: Course Loading & Preparation**

- **Input**: Directory of `.md` files + optional `.anchors.json` files
- **Process**:
  - Read all markdown files in directory
  - Extract course metadata from frontmatter
  - Combine into unified course content
  - Load and consolidate anchor IDs from `.anchors.json` files
  - Create comprehensive context for LLM processing
- **Output**: `{ combinedContent, anchorList, courseMetadata }`
- **Mastra Pattern**: Single `createStep` with file I/O operations

### **Step 2: Agent Role Definition**

- **Input**: Course content + anchor list
- **Process**: Prepare 4 specialized system prompts for Gemini:
  1. **Atomicity Agent**: Focus on single-concept KCs, eliminate duplicates
  2. **Anchors Agent**: Ensure strong anchor support for each KC
  3. **Assessment Agent**: Create testable KCs with example assessments
  4. **Bloom Agent**: Proper taxonomy level mapping
- **Output**: `{ courseContext, agentPrompts }`
- **Mastra Pattern**: Data transformation step (no LLM calls)

### **Step 3: Parallel Multi-Agent Extraction**

- **Input**: Course context + 4 agent prompts
- **Process**: Run 4 **parallel** Gemini calls using different agent perspectives
- **Output**: `{ atomicityKCs, anchorsKCs, assessmentKCs, bloomKCs }`
- **Mastra Pattern**: `.parallel([agent1, agent2, agent3, agent4])` - **KEY LEARNING OPPORTUNITY**

### **Step 4: Candidate Merging**

- **Input**: 4 sets of candidate KCs
- **Process**: Combine all candidates into unified pool (no deduplication yet)
- **Output**: `{ candidatePool }`
- **Mastra Pattern**: Pure data transformation step

### **Step 5: Master Consolidation**

- **Input**: Original course content + anchor list + candidate pool
- **Process**: Single Gemini call as "Master KC Consolidator"
  - Deduplicate overlapping KCs
  - Enforce atomicity and anchor requirements
  - Standardize formatting and Bloom levels
  - Generate KC IDs (KC-01-###)
- **Output**: `{ finalKCs }`
- **Mastra Pattern**: Single agent step with complex prompt

### **Step 6: Validation & Auto-Fix**

- **Input**: Final KCs
- **Process**:
  - Validate against Zod schema
  - Auto-fix: truncate long fields, normalize Bloom levels
  - Drop invalid KCs if unfixable
- **Output**: `{ validatedKCs, fixLog }`
- **Mastra Pattern**: Tool-based validation step

### **Step 7: Textual Evaluation (Optional)**

- **Input**: Validated KCs + original content
- **Process**: Gemini evaluation pass for:
  - Faithfulness score
  - Completeness assessment
  - Hallucination detection
  - Relevance rating
- **Output**: `{ evaluationReport }`
- **Mastra Pattern**: Optional agent step with scoring

### **Step 8: Output Generation**

- **Input**: Final KCs + evaluation report
- **Process**: Generate instructor deliverables:
  - `course_kcs.json` (structured data with metadata)
  - `evaluation_report.json` (quality metrics and extraction metadata)
- **Output**: `{ writtenFiles }`
- **Mastra Pattern**: Tool-based file writing

### **Step 9: Logging & Traceability**

- **Input**: All step outputs
- **Process**: Create comprehensive trace log
- **Output**: `{ traceLog }`
- **Mastra Pattern**: Built into Mastra workflow execution

## 🔧 **Technical Implementation Details**

### **Mastra Workflow Structure**

```typescript
const workflow = createWorkflow({
  id: 'kc-extraction-multi-agent',
  inputSchema: z.object({
    dir: z.string(),
    outDir: z.string().default('out'),
  }),
  outputSchema: z.object({
    written: z.array(z.string()),
    evaluation: z.object({...}),
  })
})
  .then(loadCourseStep)           // Step 1
  .then(prepareAgentsStep)        // Step 2
  .then(parallelExtractionStep)   // Step 3 - PARALLEL AGENTS
  .then(mergeCandidatesStep)      // Step 4
  .then(masterConsolidationStep)  // Step 5
  .then(validationStep)           // Step 6
  .then(evaluationStep)           // Step 7 (optional)
  .then(outputGenerationStep)     // Step 8
  .commit();
```

### **Key Mastra Patterns to Learn**

1. **Parallel Execution**: `.parallel([step1, step2, step3, step4])`
2. **Data Flow**: Each step's `outputSchema` → next step's `inputSchema`
3. **Agent Reuse**: Same Gemini agent with different prompts
4. **Schema Validation**: Strict Zod schemas for type safety
5. **Tool Integration**: File I/O and validation as Mastra tools
6. **Error Handling**: Built-in workflow error propagation

### **Agent Prompt Templates**

#### **Atomicity Agent**

```
You are an Atomicity Specialist. Extract KCs that are:
- Single, clear concepts (not compound ideas)
- Unique phrasing (no duplicates/synonyms)
- Action-oriented with clear verbs
- Atomic and assessable

Focus on splitting complex ideas into simple, testable components.
```

#### **Anchors Agent**

```
You are an Evidence Specialist. Extract KCs that are:
- Directly supported by 1-2 strong anchors
- Grounded in actual course content
- Traceable to specific text sections
- Never speculative or inferred

Every KC must cite valid anchor IDs from the provided list.
```

#### **Assessment Agent**

```
You are an Assessment Specialist. Extract KCs that are:
- Easily testable with 1-3 questions
- Include concrete example assessments (≤120 chars)
- Measurable learning outcomes
- Student-friendly phrasing

Focus on what instructors can actually assess.
```

#### **Bloom Agent**

```
You are a Taxonomy Specialist. Extract KCs with:
- Proper Bloom level mapping (Remember → Create)
- Verb alignment with cognitive levels
- Appropriate complexity for course level
- Clear learning progression

Map each KC to the most accurate Bloom taxonomy level.
```

## 📊 **Data Schemas**

### **KC Schema (Enhanced)**

```typescript
const KCSchema = z.object({
  kc_id: z.string().regex(/^KC-\d{2}-\d{3}$/),
  label: z.string().max(80),
  definition: z.string().max(160),
  anchors: z.array(z.string()).min(1),
  module: z.string(),
  bloom: BloomEnum,
  prerequisites: z.array(z.string()).optional(),
  example_assessment: z.string().max(120),
  notes_for_expert: z.string().max(120).optional(),
  agent_source: z.enum([
    "atomicity",
    "anchors",
    "assessment",
    "bloom",
    "master",
  ]),
  confidence_score: z.number().min(0).max(1).optional(),
});
```

### **Evaluation Schema**

```typescript
const EvaluationSchema = z.object({
  faithfulness: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  hallucination_risk: z.number().min(0).max(1),
  relevance: z.number().min(0).max(1),
  total_kcs: z.number(),
  valid_kcs: z.number(),
  comments: z.string(),
});
```

## 🎯 **Success Criteria**

1. **Functional**: Workflow processes course materials → produces valid KCs
2. **Quality**: Multi-agent approach yields better KCs than single-pass
3. **Mastra Mastery**: Demonstrates parallel execution, data flow, agents, tools
4. **Gemini-Only**: Uses only Google Gemini API (no other LLM providers)
5. **Instructor-Ready**: Outputs are immediately useful for course design

## 🚀 **Implementation Phases**

### **Phase 1: Core Workflow** (Steps 1-2-8)

- Basic file loading → single agent → output generation
- Establish Mastra patterns and data flow

### **Phase 2: Multi-Agent Processing** (Steps 3-4-5)

- Add parallel agent execution
- Implement candidate merging and master consolidation

### **Phase 3: Quality & Validation** (Steps 6-7)

- Add validation and auto-fix
- Implement evaluation scoring

### **Phase 4: Polish & Testing**

- Error handling and edge cases
- Performance optimization
- Documentation and examples

## 📁 **File Structure**

```
src/mastra/
├── workflows/
│   └── kc-multi-agent.workflow.ts     # Main workflow
├── agents/
│   ├── atomicity-agent.ts             # Atomicity specialist
│   ├── anchors-agent.ts               # Evidence specialist
│   ├── assessment-agent.ts            # Assessment specialist
│   ├── bloom-agent.ts                 # Taxonomy specialist
│   └── master-consolidator.agent.ts   # Final consolidation
├── tools/
│   ├── course-loader.tool.ts          # File loading & parsing
│   ├── kc-validator.tool.ts           # Schema validation & auto-fix
│   ├── kc-evaluator.tool.ts           # Quality evaluation
│   └── output-generator.tool.ts       # File writing
└── schemas/
    ├── kc-enhanced.ts                 # Enhanced KC schema
    └── evaluation.ts                  # Evaluation schema
```

## 🎓 **Learning Objectives**

By implementing this workflow, you'll master:

1. **Mastra Parallel Execution**: Using `.parallel()` for concurrent processing
2. **Complex Data Flow**: Managing multi-step transformations with type safety
3. **Agent Specialization**: Creating focused AI agents with specific roles
4. **Schema Evolution**: Extending and validating complex data structures
5. **Tool Composition**: Building reusable components for workflows
6. **Quality Assurance**: Implementing validation and evaluation patterns

---

## ✅ **Implementation Status**

### **Phase 1: COMPLETED** ✅

**Foundation established with basic 3-step workflow (simplified output)**

#### **Files Created:**

- `src/mastra/tools/course-loader.tool.ts` - Course material loading and metadata extraction
- `src/mastra/agents/basic-kc-extractor.agent.ts` - Basic Gemini-powered KC extraction agent
- `src/mastra/tools/output-generator.tool.ts` - JSON output generation (no Markdown)
- `src/mastra/workflows/kc-multi-agent.workflow.ts` - Phase 1 workflow implementation

#### **Workflow Structure (Phase 1):**

```typescript
const workflow = createWorkflow({
  id: "kc-multi-agent-phase1",
  inputSchema: z.object({
    dir: z.string().default("src/mastra/Structured_files"),
    outDir: z.string().default("out"),
    model: z.string().default("google:gemini-2.5-pro"),
  }),
  outputSchema: z.object({
    written: z.array(z.string()),
    summary: z.object({
      totalKCs: z.number(),
      validKCs: z.number(),
      outputFiles: z.array(z.string()),
    }),
  }),
})
  .then(loadCourseStep) // Load all .md files + .anchors.json
  .then(extractKCsStep) // Single Gemini agent extraction
  .then(generateOutputStep) // JSON output generation
  .commit();
```

#### **Current Output:**

- **Direct KC Access**: KCs returned in workflow result as `result.kcs` array
- **No File Saving**: Simplified to return data directly for easy copying
- **25 High-Quality KCs**: Successfully extracted from test course materials

#### **Mastra Patterns Implemented:**

- ✅ Tool creation with Zod schemas (`createTool`)
- ✅ Agent creation with Gemini integration
- ✅ Step composition with data flow (`createStep`)
- ✅ Sequential workflow chaining (`.then()`)
- ✅ Schema validation and type safety
- ✅ Error handling and logging

#### **Testing:**

- Available in Mastra UI as `kc-multi-agent-phase1`
- Processes files in `src/mastra/Input/` directory
- Uses only Google Gemini (2.5 Pro/Flash)
- Returns KCs directly in workflow result for easy copying

### **Phase 2: COMPLETED** ✅

**Multi-agent parallel processing with Mastra parallel execution**

#### **Files Created:**

- `src/mastra/agents/atomicity-agent.ts` - Specializes in atomic, single-concept KCs
- `src/mastra/agents/anchors-agent.ts` - Focuses on evidence-based KC extraction
- `src/mastra/agents/assessment-agent.ts` - Creates testable KCs with concrete assessments
- `src/mastra/agents/bloom-agent.ts` - Ensures accurate Bloom taxonomy classification
- `src/mastra/agents/master-consolidator.agent.ts` - Synthesizes all agent outputs
- `src/mastra/workflows/kc-multi-agent-phase2.workflow.ts` - Phase 2 workflow implementation

#### **Workflow Structure (Phase 2):**

```typescript
const workflow = createWorkflow({
  id: "kc-multi-agent-phase2",
  inputSchema: z.object({
    dir: z.string().default("src/mastra/Input"),
    outDir: z.string().default("out"),
    model: z.string().default("google:gemini-2.5-pro"),
  }),
})
  .then(loadCourseStep) // Load all .md files + .anchors.json
  .then(parallelExtractionStep) // 4 agents run in parallel with Promise.all()
  .then(masterConsolidationStep) // Master agent consolidates outputs
  .then(generateOutputStep) // Return final KCs directly
  .commit();
```

#### **Visual Parallel Processing Implementation:**

```typescript
// Visual workflow with 4 separate agent boxes
const workflow = createWorkflow({...})
  .then(loadCourseStep)
  .parallel([                    // 🎯 Creates 4 visual boxes in UI
    atomicityExtractionStep,     // Box 1: Atomicity Agent
    anchorsExtractionStep,       // Box 2: Anchors Agent
    assessmentExtractionStep,    // Box 3: Assessment Agent
    bloomExtractionStep,         // Box 4: Bloom Agent
  ])
  .then(masterConsolidationStep) // All 4 boxes connect here
  .then(generateOutputStep)
  .commit();
```

#### **Agent Specializations:**

1. **Atomicity Agent**: Extracts single-concept KCs, eliminates duplicates
2. **Anchors Agent**: Ensures strong evidence support from course content
3. **Assessment Agent**: Creates testable KCs with concrete example assessments
4. **Bloom Agent**: Accurate cognitive level classification and verb alignment
5. **Master Consolidator**: Deduplicates and synthesizes the best KCs from all agents

#### **Enhanced Output:**

- **Agent Contributions**: Shows how many KCs each agent contributed
- **Processing Metrics**: Parallel execution timing and performance data
- **Quality Synthesis**: Best insights from all 4 specialized perspectives
- **15-25 Final KCs**: Comprehensive, deduplicated, high-quality Knowledge Components

#### **Mastra Patterns Implemented:**

- ✅ **Visual Parallel Execution** with `.parallel([step1, step2, step3, step4])`
- ✅ **Agent Specialization** with focused system prompts
- ✅ **Multi-step Data Transformation** and consolidation
- ✅ **Complex Workflow Orchestration** with typed data flow
- ✅ **Master-Detail Pattern** (4 specialists → 1 consolidator)
- ✅ **Beautiful Visual Workflow** - 4 separate agent boxes in Mastra UI

#### **Testing:**

- Available in Mastra UI as `kc-multi-agent-phase2`
- **Beautiful Visual Workflow**: Shows 4 separate agent boxes running in parallel
- **Visual Flow**: `load-course` → 4 parallel boxes → `master-consolidation` → `generate-output`
- Processes files in `src/mastra/Input/` directory
- Uses only Google Gemini for all 5 agents (4 specialists + 1 master)
- Returns consolidated KCs with agent contribution metrics

### **Phase 3: COMPLETED** ✅

**Quality validation and evaluation using Mastra's built-in evaluation framework**

#### **Files Created:**

- `src/mastra/workflows/kc-multi-agent-phase3.workflow.ts` - Complete workflow with evaluation step
- Updated all agent steps to maintain data lineage through the pipeline
- Enhanced output schemas to include comprehensive evaluation results

#### **Workflow Structure (Phase 3):**

```typescript
const workflow = createWorkflow({
  id: "kc-multi-agent-phase3",
  description:
    "Phase 3: Multi-agent parallel KC extraction with parallel quality evaluation",
})
  .then(loadCourseStep) // Load all .md files + .anchors.json
  .parallel([
    // 4 agents run in parallel
    atomicityExtractionStep, // Box 1: Atomicity Agent
    anchorsExtractionStep, // Box 2: Anchors Agent
    assessmentExtractionStep, // Box 3: Assessment Agent
    bloomExtractionStep, // Box 4: Bloom Agent
  ])
  .then(masterConsolidationStep) // All 4 boxes connect here
  .parallel([
    // NEW: 4 evaluation metrics run in parallel
    faithfulnessEvaluationStep, // Box 5: Faithfulness Evaluation
    hallucinationEvaluationStep, // Box 6: Hallucination Evaluation
    completenessEvaluationStep, // Box 7: Completeness Evaluation
    answerRelevancyEvaluationStep, // Box 8: Answer Relevancy Evaluation
  ])
  .then(consolidateEvaluationStep) // All 4 evaluation boxes connect here
  .then(generateOutputStep) // Return KCs + evaluation results
  .commit();
```

#### **Evaluation Metrics Implemented:**

Our system uses 4 comprehensive evaluation metrics from Mastra's `@mastra/evals` package to assess KC quality:

##### **1. FaithfulnessMetric (LLM-as-Judge)**

**Purpose**: Measures how accurately KCs represent the course content by verifying claims against source material.

**How It Works**:

```typescript
const faithfulnessMetric = new FaithfulnessMetric(evalModel, {
  context: [combinedContent], // Real course content as context
  scale: 1,
});

const result = await faithfulnessMetric.measure(courseQuery, kcSummary);
```

**Scoring Process**:

1. **Claim Extraction**: Breaks down KC output into individual factual claims
2. **Claim Verification**: Each claim is verified against the course content
3. **Verdict Assignment**: Each claim gets "yes" (supported), "no" (contradicted), or "unsure" (unverifiable)
4. **Score Calculation**: `(supported_claims / total_claims) * scale`

**Score Interpretation**:

- **1.0**: All claims supported by course content ✅
- **0.7-0.9**: Most claims supported, few unverifiable ✅
- **0.4-0.6**: Mixed support with some contradictions ⚠️
- **0.1-0.3**: Limited support, many contradictions ❌
- **0.0**: No supported claims ❌

**Example Output**:

```json
{
  "score": 0.85,
  "reason": "The score is 0.85 because 11 out of 13 claims are supported by the context. Two claims about specific assessment methods were marked as unsure since they weren't explicitly mentioned in the course material."
}
```

##### **2. HallucinationMetric (LLM-as-Judge)**

**Purpose**: Detects fabricated information not present in the source material. **Lower scores are better** (inverted metric).

**How It Works**:

```typescript
const hallucinationMetric = new HallucinationMetric(evalModel, {
  context: [combinedContent], // Course content as source of truth
  scale: 1,
});

const result = await hallucinationMetric.measure(courseQuery, kcSummary);
```

**Scoring Process**:

1. **Statement Analysis**: Extracts factual statements from KC output
2. **Contradiction Detection**: Compares statements against course content
3. **Hallucination Identification**: Marks unsupported claims and direct contradictions
4. **Score Calculation**: `(hallucinated_statements / total_statements) * scale`

**Score Interpretation** (Lower = Better):

- **0.0**: No hallucination - perfect alignment with source ✅
- **0.1-0.2**: Minimal hallucination - very few unsupported claims ✅
- **0.3-0.5**: Moderate hallucination - some fabricated content ⚠️
- **0.6-0.8**: High hallucination - many unsupported claims ❌
- **1.0**: Complete hallucination - contradicts all context ❌

**Example Output**:

```json
{
  "score": 0.15,
  "reason": "The score is 0.15 because 2 out of 13 statements contained minor unsupported details about specific assessment formats not mentioned in the source material."
}
```

##### **3. CompletenessMetric (Rule-Based NLP)**

**Purpose**: Evaluates how thoroughly KCs cover key concepts from the course material using linguistic analysis.

**How It Works**:

```typescript
const completenessMetric = new CompletenessMetric();

const result = await completenessMetric.measure(combinedContent, kcSummary);
```

**Scoring Process**:

1. **Element Extraction**: Identifies key elements from course content:
   - Nouns (concepts, entities)
   - Verbs (actions, processes)
   - Topics (main subjects)
   - Terms (significant words)
2. **Coverage Analysis**: Checks which elements appear in KC output
3. **Matching Algorithm**:
   - Exact matches for short terms (≤3 chars)
   - Substantial overlap (>60%) for longer terms
4. **Score Calculation**: `(covered_elements / total_input_elements) * scale`

**Score Interpretation**:

- **1.0**: Complete coverage - all key elements included ✅
- **0.7-0.9**: High coverage - most key elements present ✅
- **0.4-0.6**: Partial coverage - some key elements missing ⚠️
- **0.1-0.3**: Low coverage - many key elements missing ❌
- **0.0**: No coverage - lacks all key elements ❌

**Example Output**:

```json
{
  "score": 0.78,
  "info": {
    "inputElements": [
      "diversity",
      "management",
      "workplace",
      "bias",
      "inclusion",
      "training"
    ],
    "outputElements": ["diversity", "management", "workplace", "training"],
    "missingElements": ["bias", "inclusion"],
    "elementCounts": { "input": 6, "output": 4 }
  }
}
```

##### **4. AnswerRelevancyMetric (LLM-as-Judge)**

**Purpose**: Assesses how well KCs address the course learning objectives and respond to the extraction query.

**How It Works**:

```typescript
const answerRelevancyMetric = new AnswerRelevancyMetric(evalModel, {
  uncertaintyWeight: 0.3, // Weight for "unsure" verdicts
  scale: 1,
});

const result = await answerRelevancyMetric.measure(courseQuery, kcSummary);
```

**Scoring Process**:

1. **Statement Analysis**: Breaks KC output into meaningful statements
2. **Relevance Evaluation**: Each statement assessed against the query:
   - "yes": Full weight for direct relevance
   - "unsure": Partial weight (30%) for approximate relevance
   - "no": Zero weight for irrelevant content
3. **Score Calculation**: `((direct + uncertainty * partial) / total_statements) * scale`

**Score Interpretation**:

- **1.0**: Perfect relevance - completely addresses query ✅
- **0.7-0.9**: High relevance - minor gaps or imprecisions ✅
- **0.4-0.6**: Moderate relevance - significant gaps ⚠️
- **0.1-0.3**: Low relevance - major issues ❌
- **0.0**: No relevance - off-topic or incorrect ❌

**Example Output**:

```json
{
  "score": 0.92,
  "reason": "The score is 0.92 because the extracted KCs directly address the course objectives for diversity management. All statements are highly relevant to the learning goals with clear connections to course content."
}
```

#### **Overall Quality Calculation**

Our system combines all metrics into a composite quality score:

```typescript
// Calculate overall quality score (average of all metrics)
// Note: Hallucination is inverted (lower is better), so we use (1 - score)
const overallScore =
  (faithfulnessResult.score +
    (1 - hallucinationResult.score) + // Inverted
    completenessResult.score +
    answerRelevancyResult.score) /
  4;

// Assign letter grade
let grade: "A" | "B" | "C" | "D" | "F";
if (overallScore >= 0.9)
  grade = "A"; // Excellent (90-100%)
else if (overallScore >= 0.8)
  grade = "B"; // Good (80-89%)
else if (overallScore >= 0.7)
  grade = "C"; // Satisfactory (70-79%)
else if (overallScore >= 0.6)
  grade = "D"; // Needs improvement (60-69%)
else grade = "F"; // Unsatisfactory (<60%)

const passThreshold = overallScore >= 0.7; // 70% minimum for acceptance
```

#### **Typical Evaluation Results**

With proper data pipeline (Phase 3 fixed):

```json
{
  "faithfulness": { "score": 0.89, "reason": "Most claims well-supported..." },
  "hallucination": {
    "score": 0.12,
    "reason": "Minimal unsupported content..."
  },
  "completeness": { "score": 0.83, "info": { "missingElements": ["bias"] } },
  "answerRelevancy": {
    "score": 0.95,
    "reason": "Highly relevant to objectives..."
  },
  "overallQuality": {
    "score": 0.89, // (0.89 + 0.88 + 0.83 + 0.95) / 4
    "grade": "B",
    "passThreshold": true
  }
}
```

#### **Enhanced Output with Quality Assessment:**

```typescript
evaluationResults: {
  faithfulness: { score: 0.85-0.95, reason: "Detailed explanation..." },
  hallucination: { score: 0.05-0.15, reason: "Minimal fabrication detected..." },
  completeness: { score: 0.75-0.90, info: {...} },
  answerRelevancy: { score: 0.90-1.0, reason: "Highly relevant to objectives..." },
  overallQuality: {
    score: 0.80-0.95,
    grade: "A" | "B",
    passThreshold: true
  }
}
```

#### **Critical Bug Discovery & Resolution:**

**Issue Found**: Evaluation metrics were receiving metadata instead of actual course content, causing evaluation failures (Grade F, 34% overall score).

**Root Cause**: Data pipeline was reconstructing `combinedContent` from metadata rather than passing through the real course content.

**Solution Implemented**: Updated all workflow steps to maintain data lineage:

```typescript
// Fixed: All agent steps now pass through actual course content
outputSchema: z.object({
  agentKCs: KCArraySchema,
  combinedContent: z.string(), // ← Real course content preserved
  courseMetadata: CourseMetadataSchema,
  anchorList: z.array(z.string()),
  model: z.string(),
}),
```

**Result**: Evaluation scores improved dramatically from F (34%) to A-B range (80-95%).

#### **Code Implementation in Our Workflow**

Here's how our Phase 3 workflow implements the evaluation step:

```typescript
// Step 4: KC Quality Evaluation
const evaluateKCsStep = createStep({
  id: "evaluate-kcs",
  description: "Evaluate KC quality using Mastra built-in evaluation metrics",
  execute: async ({ inputData }) => {
    const { finalKCs, combinedContent, anchorList, extractionMetadata } =
      inputData;

    // Create evaluation model (same as extraction model)
    const evalModel = google(
      extractionMetadata.model_used.replace("google:", "")
    );

    // Prepare context for evaluation (course content as context)
    const contextChunks = [combinedContent]; // ← CRITICAL: Real course content

    // Initialize evaluation metrics
    const faithfulnessMetric = new FaithfulnessMetric(evalModel, {
      context: contextChunks, // Real course material
      scale: 1,
    });

    const hallucinationMetric = new HallucinationMetric(evalModel, {
      context: contextChunks, // Same course material
      scale: 1,
    });

    const completenessMetric = new CompletenessMetric(); // No LLM needed

    const answerRelevancyMetric = new AnswerRelevancyMetric(evalModel, {
      scale: 1,
    });

    // Prepare KC content for evaluation
    const kcSummary = finalKCs
      .map(
        (kc) =>
          `${kc.label}: ${kc.definition} (Bloom: ${kc.bloom}, Anchors: ${kc.anchors.join(", ")})`
      )
      .join("\n");

    const courseQuery = `Extract knowledge components from the course "${courseMetadata.title}"`;

    // Run evaluations in parallel for efficiency
    const [
      faithfulnessResult,
      hallucinationResult,
      completenessResult,
      answerRelevancyResult,
    ] = await Promise.all([
      faithfulnessMetric.measure(courseQuery, kcSummary),
      hallucinationMetric.measure(courseQuery, kcSummary),
      completenessMetric.measure(combinedContent, kcSummary), // Note: different inputs
      answerRelevancyMetric.measure(courseQuery, kcSummary),
    ]);

    // Calculate composite quality score
    const overallScore =
      (faithfulnessResult.score +
        (1 - hallucinationResult.score) + // Inverted (lower hallucination = better)
        completenessResult.score +
        answerRelevancyResult.score) /
      4;

    // Assign letter grade and pass/fail
    let grade: "A" | "B" | "C" | "D" | "F";
    if (overallScore >= 0.9) grade = "A";
    else if (overallScore >= 0.8) grade = "B";
    else if (overallScore >= 0.7) grade = "C";
    else if (overallScore >= 0.6) grade = "D";
    else grade = "F";

    const passThreshold = overallScore >= 0.7; // 70% minimum

    return {
      finalKCs,
      courseMetadata,
      extractionMetadata,
      evaluationResults: {
        faithfulness: {
          score: faithfulnessResult.score,
          reason: faithfulnessResult.info.reason,
        },
        hallucination: {
          score: hallucinationResult.score,
          reason: hallucinationResult.info.reason,
        },
        completeness: {
          score: completenessResult.score,
          info: completenessResult.info,
        },
        answerRelevancy: {
          score: answerRelevancyResult.score,
          reason: answerRelevancyResult.info.reason,
        },
        overallQuality: {
          score: overallScore,
          grade,
          passThreshold,
        },
      },
    };
  },
});
```

#### **Key Implementation Details**

1. **Parallel Evaluation**: All metrics run concurrently using `Promise.all()` for efficiency
2. **Context Management**: Real course content (`combinedContent`) passed to context-dependent metrics
3. **Data Preparation**: KCs formatted as readable summary for evaluation
4. **Score Inversion**: Hallucination metric inverted since lower scores are better
5. **Composite Scoring**: Simple average of all normalized metrics
6. **Grading System**: Standard A-F letter grades with 70% pass threshold

#### **Mastra Patterns Implemented:**

- ✅ **Evaluation Integration** - Using `@mastra/evals` built-in metrics
- ✅ **LLM-as-Judge** - FaithfulnessMetric, HallucinationMetric, AnswerRelevancyMetric
- ✅ **Rule-based Evals** - CompletenessMetric using NLP analysis
- ✅ **Parallel Evaluation** - Running multiple metrics concurrently
- ✅ **Quality Scoring** - Combining metrics into overall quality assessment
- ✅ **Data Pipeline Validation** - Comprehensive testing revealed and fixed critical bugs

#### **Testing:**

- Available in Mastra UI as `kc-multi-agent-phase3`
- **Complete Quality Assessment**: Shows detailed evaluation results with reasoning
- **Enhanced Visual Flow**:
  ```
  load-course →
  [4 parallel agent boxes] →
  master-consolidation →
  [4 parallel evaluation boxes] →
  consolidate-evaluation →
  generate-output
  ```
- **Visual Evaluation Boxes**: Each evaluation metric appears as a separate box in the UI:
  - `faithfulness-evaluation` - Faithfulness assessment
  - `hallucination-evaluation` - Hallucination detection
  - `completeness-evaluation` - Completeness analysis
  - `answer-relevancy-evaluation` - Relevancy scoring
- Processes files in `src/mastra/Input/` directory
- Uses only Google Gemini for all agents and LLM-based evaluations
- Returns KCs with comprehensive quality metrics and grades

### **Phase 4: PLANNED** ⏳

**Production readiness and optimization**

---

**Current Status**: Phase 3 complete with comprehensive quality evaluation! 🚀  
**Research Achievement**: Demonstrates complete multi-agent educational AI system with quality assurance  
**Thesis Contribution**: Provides comprehensive technical documentation for advanced AI workflow orchestration

**Available Workflows:**

- `kc-multi-agent-phase1` - Basic single-agent extraction (Phase 1)
- `kc-multi-agent-phase2` - Advanced parallel multi-agent processing (Phase 2)
- `kc-multi-agent-phase3` - Complete system with quality evaluation (Phase 3) ⭐
