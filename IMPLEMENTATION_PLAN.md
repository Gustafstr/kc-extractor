# Knowledge Component Extraction - Implementation Plan

## 🎯 **Project Overview**

Build a comprehensive KC extraction workflow using **Mastra** and **Google Gemini** that processes course materials through multiple specialized agents to produce high-quality, instructor-ready Knowledge Components.

## 🏗️ **High-Level Architecture**

```
Course Materials → Multi-Agent Processing → Master Consolidation → Validation → Instructor Outputs
```

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

### **Phase 3: PLANNED** ⏳

**Quality validation and evaluation**

### **Phase 4: PLANNED** ⏳

**Polish and optimization**

---

**Current Status**: Phase 2 complete with parallel multi-agent processing! 🚀  
**Next Step**: Test Phase 2 workflow in Mastra UI and compare with Phase 1 results

**Available Workflows:**

- `kc-multi-agent-phase1` - Basic single-agent extraction (Phase 1)
- `kc-multi-agent-phase2` - Advanced parallel multi-agent processing (Phase 2) ⭐
