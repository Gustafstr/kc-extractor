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
import { retryAgentGenerate } from '../utils/retry';

// Import Mastra evaluation metrics
import { FaithfulnessMetric } from '@mastra/evals/llm';
import { HallucinationMetric } from '@mastra/evals/llm';
import { CompletenessMetric } from '@mastra/evals/nlp';
import { AnswerRelevancyMetric } from '@mastra/evals/llm';

// Workflow input schema
const inputSchema = z.object({
  dir: z.string().default('src/mastra/Input'),
  outDir: z.string().default('out'),
  model: z.string().default('gemini-1.5-pro'),
  courseTitle: z.string().default('Course Knowledge Components'),
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
    courseTitle: z.string(),
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
      courseTitle: inputData.courseTitle,
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
    courseTitle: z.string(),
  }),
  outputSchema: z.object({
    atomicityKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    combinedContent: z.string(),
    model: z.string(),
    courseTitle: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model, courseTitle } = inputData;

    const atomicityAgent = createAtomicityAgent(model);
    const atomicityPrompt = createAtomicityPrompt(combinedContent, anchorList, courseTitle);

    const atomicityResult = await retryAgentGenerate(
      () => atomicityAgent.generate(
        [{ role: 'user', content: atomicityPrompt }],
        { output: KCArraySchema }
      )
    );

    return {
      atomicityKCs: atomicityResult.object || [],
      courseMetadata,
      anchorList,
      combinedContent,
      model,
      courseTitle,
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
    courseTitle: z.string(),
  }),
  outputSchema: z.object({
    anchorsKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    combinedContent: z.string(),
    model: z.string(),
    courseTitle: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model, courseTitle } = inputData;

    const anchorsAgent = createAnchorsAgent(model);
    const anchorsPrompt = createAnchorsPrompt(combinedContent, anchorList, courseTitle);

    const anchorsResult = await retryAgentGenerate(
      () => anchorsAgent.generate(
        [{ role: 'user', content: anchorsPrompt }],
        { output: KCArraySchema }
      )
    );

    return {
      anchorsKCs: anchorsResult.object || [],
      courseMetadata,
      anchorList,
      combinedContent,
      model,
      courseTitle,
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
    courseTitle: z.string(),
  }),
  outputSchema: z.object({
    assessmentKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    combinedContent: z.string(),
    model: z.string(),
    courseTitle: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model, courseTitle } = inputData;

    const assessmentAgent = createAssessmentAgent(model);
    const assessmentPrompt = createAssessmentPrompt(combinedContent, anchorList, courseTitle);

    const assessmentResult = await retryAgentGenerate(
      () => assessmentAgent.generate(
        [{ role: 'user', content: assessmentPrompt }],
        { output: KCArraySchema }
      )
    );

    return {
      assessmentKCs: assessmentResult.object || [],
      courseMetadata,
      anchorList,
      combinedContent,
      model,
      courseTitle,
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
    courseTitle: z.string(),
  }),
  outputSchema: z.object({
    bloomKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    combinedContent: z.string(),
    model: z.string(),
    courseTitle: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model, courseTitle } = inputData;

    const bloomAgent = createBloomAgent(model);
    const bloomPrompt = createBloomPrompt(combinedContent, anchorList, courseTitle);

    const bloomResult = await retryAgentGenerate(
      () => bloomAgent.generate(
        [{ role: 'user', content: bloomPrompt }],
        { output: KCArraySchema }
      )
    );

    return {
      bloomKCs: bloomResult.object || [],
      courseMetadata,
      anchorList,
      combinedContent,
      model,
      courseTitle,
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
      courseTitle: z.string(),
    }),
    'anchors-extraction': z.object({
      anchorsKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      model: z.string(),
      courseTitle: z.string(),
    }),
    'assessment-extraction': z.object({
      assessmentKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      model: z.string(),
      courseTitle: z.string(),
    }),
    'bloom-extraction': z.object({
      bloomKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      model: z.string(),
      courseTitle: z.string(),
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
    const { courseMetadata, anchorList, combinedContent, model, courseTitle } = inputData['atomicity-extraction'];

    // Create master consolidator agent
    const masterAgent = createMasterConsolidatorAgent(model);
    const consolidationPrompt = createMasterConsolidationPrompt(
      atomicityKCs,
      anchorsKCs,
      assessmentKCs,
      bloomKCs,
      anchorList,
      courseTitle
    );

    // Run master consolidation
    const consolidationResult = await retryAgentGenerate(
      () => masterAgent.generate(
        [{ role: 'user', content: consolidationPrompt }],
        { output: KCArraySchema }
      )
    );

    const finalKCs = consolidationResult.object || [];

    return {
      finalKCs,
      courseMetadata,
      combinedContent,
      anchorList,
      courseTitle,
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

// Common input schema for all evaluation steps
const evaluationInputSchema = z.object({
  finalKCs: KCArraySchema,
  courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
  combinedContent: z.string(),
  anchorList: z.array(z.string()),
  courseTitle: z.string(),
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
});

// Step 4a: Faithfulness Evaluation
const faithfulnessEvaluationStep = createStep({
  id: 'faithfulness-evaluation',
  description: 'Evaluate KC faithfulness - how accurately KCs represent course content',
  inputSchema: evaluationInputSchema,
  outputSchema: z.object({
    faithfulnessResult: z.object({
      score: z.number(),
      reason: z.string(),
    }),
    // Pass through all data for next steps
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    combinedContent: z.string(),
    courseTitle: z.string(),
    extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
  }),
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, combinedContent, extractionMetadata, courseTitle } = inputData;

    // Create evaluation model
    const evalModel = google(extractionMetadata.model_used.replace('google:', ''));

    // Initialize faithfulness metric
    const faithfulnessMetric = new FaithfulnessMetric(evalModel, {
      context: [combinedContent],
      scale: 1,
    });

    // Prepare KC content for evaluation
    const kcSummary = finalKCs.map(kc => 
      `${kc.label}: ${kc.definition} (Bloom: ${kc.bloom}, Anchors: ${kc.anchors.join(', ')})`
    ).join('\n');

    const courseQuery = `Extract knowledge components from the course "${courseTitle}"`;

    // Run faithfulness evaluation
    const faithfulnessResult = await faithfulnessMetric.measure(courseQuery, kcSummary);

    return {
      faithfulnessResult: {
        score: faithfulnessResult.score,
        reason: faithfulnessResult.info.reason,
      },
      finalKCs,
      courseMetadata,
      combinedContent,
      courseTitle,
      extractionMetadata,
    };
  },
});

// Step 4b: Hallucination Evaluation
const hallucinationEvaluationStep = createStep({
  id: 'hallucination-evaluation',
  description: 'Evaluate KC hallucination - detect fabricated information not in source',
  inputSchema: evaluationInputSchema,
  outputSchema: z.object({
    hallucinationResult: z.object({
      score: z.number(),
      reason: z.string(),
    }),
    // Pass through all data for next steps
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    combinedContent: z.string(),
    courseTitle: z.string(),
    extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
  }),
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, combinedContent, extractionMetadata, courseTitle } = inputData;

    // Create evaluation model
    const evalModel = google(extractionMetadata.model_used.replace('google:', ''));

    // Initialize hallucination metric
    const hallucinationMetric = new HallucinationMetric(evalModel, {
      context: [combinedContent],
      scale: 1,
    });

    // Prepare KC content for evaluation
    const kcSummary = finalKCs.map(kc => 
      `${kc.label}: ${kc.definition} (Bloom: ${kc.bloom}, Anchors: ${kc.anchors.join(', ')})`
    ).join('\n');

    const courseQuery = `Extract knowledge components from the course "${courseTitle}"`;

    // Run hallucination evaluation
    const hallucinationResult = await hallucinationMetric.measure(courseQuery, kcSummary);

    return {
      hallucinationResult: {
        score: hallucinationResult.score,
        reason: hallucinationResult.info.reason,
      },
      finalKCs,
      courseMetadata,
      combinedContent,
      courseTitle,
      extractionMetadata,
    };
  },
});

// Step 4c: Completeness Evaluation
const completenessEvaluationStep = createStep({
  id: 'completeness-evaluation',
  description: 'Evaluate KC completeness - how thoroughly KCs cover key course concepts',
  inputSchema: evaluationInputSchema,
  outputSchema: z.object({
    completenessResult: z.object({
      score: z.number(),
      info: z.any(),
    }),
    // Pass through all data for next steps
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    combinedContent: z.string(),
    courseTitle: z.string(),
    extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
  }),
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, combinedContent, extractionMetadata, courseTitle } = inputData;

    // Initialize completeness metric (no LLM needed)
    const completenessMetric = new CompletenessMetric();

    // Prepare KC content for evaluation
    const kcSummary = finalKCs.map(kc => 
      `${kc.label}: ${kc.definition} (Bloom: ${kc.bloom}, Anchors: ${kc.anchors.join(', ')})`
    ).join('\n');

    // Run completeness evaluation (note: different input order)
    const completenessResult = await completenessMetric.measure(combinedContent, kcSummary);

    return {
      completenessResult: {
        score: completenessResult.score,
        info: completenessResult.info,
      },
      finalKCs,
      courseMetadata,
      combinedContent,
      courseTitle,
      extractionMetadata,
    };
  },
});

// Step 4d: Answer Relevancy Evaluation
const answerRelevancyEvaluationStep = createStep({
  id: 'answer-relevancy-evaluation',
  description: 'Evaluate KC relevancy - how well KCs address course learning objectives',
  inputSchema: evaluationInputSchema,
  outputSchema: z.object({
    answerRelevancyResult: z.object({
      score: z.number(),
      reason: z.string(),
    }),
    // Pass through all data for next steps
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    combinedContent: z.string(),
    courseTitle: z.string(),
    extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
  }),
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, combinedContent, extractionMetadata, courseTitle } = inputData;

    // Create evaluation model
    const evalModel = google(extractionMetadata.model_used.replace('google:', ''));

    // Initialize answer relevancy metric
    const answerRelevancyMetric = new AnswerRelevancyMetric(evalModel, {
      scale: 1,
    });

    // Prepare KC content for evaluation
    const kcSummary = finalKCs.map(kc => 
      `${kc.label}: ${kc.definition} (Bloom: ${kc.bloom}, Anchors: ${kc.anchors.join(', ')})`
    ).join('\n');

    const courseQuery = `Extract knowledge components from the course "${courseTitle}"`;

    // Run answer relevancy evaluation
    const answerRelevancyResult = await answerRelevancyMetric.measure(courseQuery, kcSummary);

    return {
      answerRelevancyResult: {
        score: answerRelevancyResult.score,
        reason: answerRelevancyResult.info.reason,
      },
      finalKCs,
      courseMetadata,
      combinedContent,
      courseTitle,
      extractionMetadata,
    };
  },
});

// Step 5: Consolidate Evaluation Results
const consolidateEvaluationStep = createStep({
  id: 'consolidate-evaluation',
  description: 'Combine all evaluation results and calculate overall quality score',
  inputSchema: z.object({
    'faithfulness-evaluation': z.object({
      faithfulnessResult: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      finalKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      combinedContent: z.string(),
      courseTitle: z.string(),
      extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
    }),
    'hallucination-evaluation': z.object({
      hallucinationResult: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      finalKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      combinedContent: z.string(),
      courseTitle: z.string(),
      extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
    }),
    'completeness-evaluation': z.object({
      completenessResult: z.object({
        score: z.number(),
        info: z.any(),
      }),
      finalKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      combinedContent: z.string(),
      courseTitle: z.string(),
      extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
    }),
    'answer-relevancy-evaluation': z.object({
      answerRelevancyResult: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      finalKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      combinedContent: z.string(),
      courseTitle: z.string(),
      extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
    }),
  }),
  outputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
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
    // Extract results from all parallel evaluation steps
    const faithfulnessResult = inputData['faithfulness-evaluation'].faithfulnessResult;
    const hallucinationResult = inputData['hallucination-evaluation'].hallucinationResult;
    const completenessResult = inputData['completeness-evaluation'].completenessResult;
    const answerRelevancyResult = inputData['answer-relevancy-evaluation'].answerRelevancyResult;

    // Get metadata from first result (all should be the same)
    const { finalKCs, courseMetadata, extractionMetadata } = inputData['faithfulness-evaluation'];

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
        faithfulness: faithfulnessResult,
        hallucination: hallucinationResult,
        completeness: completenessResult,
        answerRelevancy: answerRelevancyResult,
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

// Create the Phase 3 workflow with parallel evaluation
const workflow = createWorkflow({
  id: 'kc-multi-agent-phase3',
  description: 'Phase 3: Multi-agent parallel KC extraction with parallel quality evaluation',
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
  .parallel([  // NEW: Parallel evaluation steps
    faithfulnessEvaluationStep,
    hallucinationEvaluationStep,
    completenessEvaluationStep,
    answerRelevancyEvaluationStep,
  ])
  .then(consolidateEvaluationStep)  // NEW: Consolidate evaluation results
  .then(generateOutputStep);

workflow.commit();

export { workflow as kcMultiAgentPhase3Workflow };
