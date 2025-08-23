import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { courseLoaderTool } from '../tools/course-loader.tool';
import { createAtomicityAgent, createAtomicityPrompt } from '../agents/atomicity-agent';
import { createAnchorsAgent, createAnchorsPrompt } from '../agents/anchors-agent';
import { createAssessmentAgent, createAssessmentPrompt } from '../agents/assessment-agent';
import { createBloomAgent, createBloomPrompt } from '../agents/bloom-agent';
import { createMasterConsolidatorAgent, createMasterConsolidationPrompt } from '../agents/master-consolidator.agent';
import { KCArraySchema } from '../schemas/kc';

// Workflow input schema
const inputSchema = z.object({
  dir: z.string().default('src/mastra/Input'),
  outDir: z.string().default('out'),
  model: z.string().default('google:gemini-2.5-pro'),
});

// Workflow output schema
const outputSchema = z.object({
  written: z.array(z.string()),
  summary: z.object({
    totalKCs: z.number(),
    validKCs: z.number(),
    outputFiles: z.array(z.string()),
    agentContributions: z.object({
      atomicity: z.number(),
      anchors: z.number(),
      assessment: z.number(),
      bloom: z.number(),
      final: z.number(),
    }),
  }),
  // Include the actual extracted data for easy access
  kcs: KCArraySchema,
  courseMetadata: z.object({
    title: z.string(),
    totalFiles: z.number(),
    totalAnchors: z.number(),
  }),
  extractionMetadata: z.object({
    model_used: z.string(),
    phase: z.string(),
    parallel_agents: z.number(),
    total_processing_time: z.number(),
  }),
});

// Course loader output schema
const courseLoaderOutputSchema = z.object({
  combinedContent: z.string(),
  anchorList: z.array(z.string()),
  courseMetadata: z.object({
    title: z.string(),
    totalFiles: z.number(),
    totalAnchors: z.number(),
  }),
  fileList: z.array(z.string()),
});

// Step 1: Load Course Materials (same as Phase 1)
const loadCourseStep = createStep({
  id: 'load-course',
  description: 'Load and combine all course markdown files with metadata extraction',
  inputSchema,
  outputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    model: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const result = await courseLoaderTool.execute({
      context: { dir: inputData.dir },
      mastra,
      runtimeContext: undefined as any,
    });

    return {
      ...result,
      outDir: inputData.outDir,
      model: inputData.model,
    };
  },
});

// Step 2a: Atomicity Agent Extraction
const atomicityExtractionStep = createStep({
  id: 'atomicity-extraction',
  description: 'Extract atomic, single-concept Knowledge Components',
  inputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    model: z.string(),
  }),
  outputSchema: z.object({
    atomicityKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    model: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model } = inputData;
    
    const atomicityAgent = createAtomicityAgent(model);
    const atomicityPrompt = createAtomicityPrompt(combinedContent, anchorList, courseMetadata.title);
    
    const atomicityResult = await atomicityAgent.generate(
      [{ role: 'user', content: atomicityPrompt }], 
      { output: KCArraySchema }
    );
    
    return {
      atomicityKCs: atomicityResult.object || [],
      courseMetadata,
      anchorList,
      model,
    };
  },
});

// Step 2b: Anchors Agent Extraction
const anchorsExtractionStep = createStep({
  id: 'anchors-extraction',
  description: 'Extract evidence-based Knowledge Components with strong anchor support',
  inputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    model: z.string(),
  }),
  outputSchema: z.object({
    anchorsKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    model: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model } = inputData;
    
    const anchorsAgent = createAnchorsAgent(model);
    const anchorsPrompt = createAnchorsPrompt(combinedContent, anchorList, courseMetadata.title);
    
    const anchorsResult = await anchorsAgent.generate(
      [{ role: 'user', content: anchorsPrompt }], 
      { output: KCArraySchema }
    );
    
    return {
      anchorsKCs: anchorsResult.object || [],
      courseMetadata,
      anchorList,
      model,
    };
  },
});

// Step 2c: Assessment Agent Extraction
const assessmentExtractionStep = createStep({
  id: 'assessment-extraction',
  description: 'Extract testable Knowledge Components with concrete assessment examples',
  inputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    model: z.string(),
  }),
  outputSchema: z.object({
    assessmentKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    model: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model } = inputData;
    
    const assessmentAgent = createAssessmentAgent(model);
    const assessmentPrompt = createAssessmentPrompt(combinedContent, anchorList, courseMetadata.title);
    
    const assessmentResult = await assessmentAgent.generate(
      [{ role: 'user', content: assessmentPrompt }], 
      { output: KCArraySchema }
    );
    
    return {
      assessmentKCs: assessmentResult.object || [],
      courseMetadata,
      anchorList,
      model,
    };
  },
});

// Step 2d: Bloom Agent Extraction
const bloomExtractionStep = createStep({
  id: 'bloom-extraction',
  description: 'Extract Knowledge Components with accurate Bloom taxonomy classification',
  inputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    model: z.string(),
  }),
  outputSchema: z.object({
    bloomKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    model: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model } = inputData;
    
    const bloomAgent = createBloomAgent(model);
    const bloomPrompt = createBloomPrompt(combinedContent, anchorList, courseMetadata.title);
    
    const bloomResult = await bloomAgent.generate(
      [{ role: 'user', content: bloomPrompt }], 
      { output: KCArraySchema }
    );
    
    return {
      bloomKCs: bloomResult.object || [],
      courseMetadata,
      anchorList,
      model,
    };
  },
});

// Step 3: Master Consolidation
const masterConsolidationStep = createStep({
  id: 'master-consolidation',
  description: 'Consolidate all agent outputs into final, deduplicated KC set',
  inputSchema: z.object({
    'atomicity-extraction': z.object({
      atomicityKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      model: z.string(),
    }),
    'anchors-extraction': z.object({
      anchorsKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      model: z.string(),
    }),
    'assessment-extraction': z.object({
      assessmentKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      model: z.string(),
    }),
    'bloom-extraction': z.object({
      bloomKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      model: z.string(),
    }),
  }),
  outputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    extractionMetadata: z.object({
      model_used: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      agent_contributions: z.object({
        atomicity: z.number(),
        anchors: z.number(),
        assessment: z.number(),
        bloom: z.number(),
      }),
    }),
  }),
  execute: async ({ inputData }) => {
    // Extract KCs from all parallel step results
    const atomicityKCs = inputData['atomicity-extraction'].atomicityKCs;
    const anchorsKCs = inputData['anchors-extraction'].anchorsKCs;
    const assessmentKCs = inputData['assessment-extraction'].assessmentKCs;
    const bloomKCs = inputData['bloom-extraction'].bloomKCs;
    
    // Get metadata from first result (all should be the same)
    const { courseMetadata, anchorList, model } = inputData['atomicity-extraction'];

    // Create master consolidator agent
    const masterAgent = createMasterConsolidatorAgent(model);
    const consolidationPrompt = createMasterConsolidationPrompt(
      atomicityKCs,
      anchorsKCs,
      assessmentKCs,
      bloomKCs,
      anchorList,
      courseMetadata.title
    );

    // Run master consolidation
    const consolidationResult = await masterAgent.generate(
      [{ role: 'user', content: consolidationPrompt }],
      { output: KCArraySchema }
    );

    const finalKCs = consolidationResult.object || [];

    return {
      finalKCs,
      courseMetadata,
      extractionMetadata: {
        model_used: model,
        phase: 'Phase 2 - Multi-Agent Parallel Processing (Visual)',
        parallel_agents: 4,
        total_processing_time: 0, // Will be calculated by Mastra
        agent_contributions: {
          atomicity: atomicityKCs.length,
          anchors: anchorsKCs.length,
          assessment: assessmentKCs.length,
          bloom: bloomKCs.length,
        },
      },
    };
  },
});

// Step 4: Return Results (No File Saving)
const generateOutputStep = createStep({
  id: 'generate-output',
  description: 'Return consolidated KCs directly in the workflow result',
  inputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    extractionMetadata: z.object({
      model_used: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      agent_contributions: z.object({
        atomicity: z.number(),
        anchors: z.number(),
        assessment: z.number(),
        bloom: z.number(),
      }),
    }),
  }),
  outputSchema,
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, extractionMetadata } = inputData;

    return {
      written: [], // No files written
      summary: {
        totalKCs: finalKCs.length,
        validKCs: finalKCs.filter(kc => kc.anchors && kc.anchors.length > 0).length,
        outputFiles: [], // No files generated
        agentContributions: {
          atomicity: extractionMetadata.agent_contributions.atomicity,
          anchors: extractionMetadata.agent_contributions.anchors,
          assessment: extractionMetadata.agent_contributions.assessment,
          bloom: extractionMetadata.agent_contributions.bloom,
          final: finalKCs.length,
        },
      },
      kcs: finalKCs,
      courseMetadata: courseMetadata,
      extractionMetadata: {
        model_used: extractionMetadata.model_used,
        phase: extractionMetadata.phase,
        parallel_agents: extractionMetadata.parallel_agents,
        total_processing_time: extractionMetadata.total_processing_time,
      },
    };
  },
});

// Create the Phase 2 workflow with visual parallel execution
const workflow = createWorkflow({
  id: 'kc-multi-agent-phase2',
  description: 'Phase 2: Multi-agent parallel KC extraction with visual workflow',
  inputSchema,
  outputSchema,
})
  .then(loadCourseStep)
  .parallel([
    atomicityExtractionStep,
    anchorsExtractionStep,
    assessmentExtractionStep,
    bloomExtractionStep,
  ])
  .then(masterConsolidationStep)
  .then(generateOutputStep);

workflow.commit();

export { workflow as kcMultiAgentPhase2Workflow };
