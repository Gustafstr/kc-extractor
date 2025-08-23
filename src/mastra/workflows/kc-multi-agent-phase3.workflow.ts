import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { courseLoaderTool } from '../tools/course-loader.tool';
import { createAtomicityAgent, createAtomicityPrompt } from '../agents/atomicity-agent';
import { createAnchorsAgent, createAnchorsPrompt } from '../agents/anchors-agent';
import { createAssessmentAgent, createAssessmentPrompt } from '../agents/assessment-agent';
import { createBloomAgent, createBloomPrompt } from '../agents/bloom-agent';
import { createMasterConsolidatorAgent, createMasterConsolidationPrompt } from '../agents/master-consolidator.agent';
import { KCArraySchema } from '../schemas/kc';

// Import Mastra evaluation metrics
import { FaithfulnessMetric } from '@mastra/evals/llm';
import { HallucinationMetric } from '@mastra/evals/llm';
import { CompletenessMetric } from '@mastra/evals/nlp';
import { AnswerRelevancyMetric } from '@mastra/evals/llm';

// Workflow input schema
const inputSchema = z.object({
  dir: z.string().default('src/mastra/Input'),
  outDir: z.string().default('out'),
  model: z.string().default('google:gemini-2.5-pro'),
});

// Enhanced output schema with evaluation results
const outputSchema = z.object({
  written: z.array(z.string()),
  summary: z.object({
    totalKCs: z.number(),
    validKCs: z.number(),
    outputFiles: z.array(z.string()),
  }),
  finalKCs: KCArraySchema,
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
    agent_contributions: z.object({
      atomicity: z.number(),
      anchors: z.number(),
      assessment: z.number(),
      bloom: z.number(),
    }),
  }),
  // NEW: Evaluation results
  evaluationResults: z.object({
    faithfulness: z.object({
      score: z.number(),
      reason: z.string(),
    }),
    hallucination: z.object({
      score: z.number(),
      reason: z.string(),
    }),
    completeness: z.object({
      score: z.number(),
      info: z.any(),
    }),
    answerRelevancy: z.object({
      score: z.number(),
      reason: z.string(),
    }),
    overallQuality: z.object({
      score: z.number(),
      grade: z.enum(['A', 'B', 'C', 'D', 'F']),
      passThreshold: z.boolean(),
    }),
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

// Step 1: Load Course Materials
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
    combinedContent: z.string(),
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
      combinedContent,
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
    combinedContent: z.string(),
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
      combinedContent,
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
    combinedContent: z.string(),
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
      combinedContent,
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
    combinedContent: z.string(),
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
      combinedContent,
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
      combinedContent: z.string(),
      model: z.string(),
    }),
    'anchors-extraction': z.object({
      anchorsKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      model: z.string(),
    }),
    'assessment-extraction': z.object({
      assessmentKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      model: z.string(),
    }),
    'bloom-extraction': z.object({
      bloomKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      model: z.string(),
    }),
  }),
  outputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    combinedContent: z.string(),
    anchorList: z.array(z.string()),
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
    const { courseMetadata, anchorList, combinedContent, model } = inputData['atomicity-extraction'];

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
      combinedContent,
      anchorList,
      extractionMetadata: {
        model_used: model,
        phase: 'Phase 3 - Multi-Agent with Quality Evaluation',
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

// Step 4: NEW - KC Quality Evaluation
const evaluateKCsStep = createStep({
  id: 'evaluate-kcs',
  description: 'Evaluate KC quality using Mastra built-in evaluation metrics',
  inputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    combinedContent: z.string(),
    anchorList: z.array(z.string()),
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
    evaluationResults: z.object({
      faithfulness: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      hallucination: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      completeness: z.object({
        score: z.number(),
        info: z.any(),
      }),
      answerRelevancy: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      overallQuality: z.object({
        score: z.number(),
        grade: z.enum(['A', 'B', 'C', 'D', 'F']),
        passThreshold: z.boolean(),
      }),
    }),
  }),
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, combinedContent, anchorList, extractionMetadata } = inputData;

    // Create evaluation model (same as extraction model)
    const evalModel = google(extractionMetadata.model_used.replace('google:', ''));

    // Prepare context for evaluation (course content as context)
    const contextChunks = [combinedContent];

    // Initialize evaluation metrics
    const faithfulnessMetric = new FaithfulnessMetric(evalModel, {
      context: contextChunks,
      scale: 1,
    });

    const hallucinationMetric = new HallucinationMetric(evalModel, {
      context: contextChunks,
      scale: 1,
    });

    const completenessMetric = new CompletenessMetric();

    const answerRelevancyMetric = new AnswerRelevancyMetric(evalModel, {
      scale: 1,
    });

    // Prepare KC content for evaluation
    const kcSummary = finalKCs.map(kc => 
      `${kc.label}: ${kc.definition} (Bloom: ${kc.bloom}, Anchors: ${kc.anchors.join(', ')})`
    ).join('\n');

    const courseQuery = `Extract knowledge components from the course "${courseMetadata.title}"`;

    // Run evaluations
    const [faithfulnessResult, hallucinationResult, completenessResult, answerRelevancyResult] = await Promise.all([
      faithfulnessMetric.measure(courseQuery, kcSummary),
      hallucinationMetric.measure(courseQuery, kcSummary),
      completenessMetric.measure(combinedContent, kcSummary),
      answerRelevancyMetric.measure(courseQuery, kcSummary),
    ]);

    // Calculate overall quality score (average of all metrics)
    // Note: Hallucination is inverted (lower is better), so we use (1 - score)
    const overallScore = (
      faithfulnessResult.score +
      (1 - hallucinationResult.score) +
      completenessResult.score +
      answerRelevancyResult.score
    ) / 4;

    // Assign grade based on overall score
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 0.9) grade = 'A';
    else if (overallScore >= 0.8) grade = 'B';
    else if (overallScore >= 0.7) grade = 'C';
    else if (overallScore >= 0.6) grade = 'D';
    else grade = 'F';

    const passThreshold = overallScore >= 0.7; // 70% threshold

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

// Step 5: Generate Output (with evaluation results)
const generateOutputStep = createStep({
  id: 'generate-output',
  description: 'Return consolidated KCs with evaluation results directly in the workflow result',
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
    evaluationResults: z.object({
      faithfulness: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      hallucination: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      completeness: z.object({
        score: z.number(),
        info: z.any(),
      }),
      answerRelevancy: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      overallQuality: z.object({
        score: z.number(),
        grade: z.enum(['A', 'B', 'C', 'D', 'F']),
        passThreshold: z.boolean(),
      }),
    }),
  }),
  outputSchema,
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, extractionMetadata, evaluationResults } = inputData;

    return {
      written: [],
      summary: {
        totalKCs: finalKCs.length,
        validKCs: finalKCs.filter(kc => kc.anchors && kc.anchors.length > 0).length,
        outputFiles: [],
      },
      finalKCs,
      courseMetadata,
      extractionMetadata,
      evaluationResults,
    };
  },
});

// Create the Phase 3 workflow with evaluation
const workflow = createWorkflow({
  id: 'kc-multi-agent-phase3',
  description: 'Phase 3: Multi-agent parallel KC extraction with quality evaluation',
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
  .then(evaluateKCsStep)  // NEW: Evaluation step
  .then(generateOutputStep);

workflow.commit();

export { workflow as kcMultiAgentPhase3Workflow };
