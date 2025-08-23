import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { KCArraySchema } from '../schemas/kc';
import { courseLoaderTool } from '../tools/course-loader.tool';

import { createBasicKCExtractorAgent, createKCExtractionPrompt } from '../agents/basic-kc-extractor.agent';

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
    prompt_length: z.number(),
    anchors_available: z.number(),
  }),
});

// Step 1: Load Course Materials
const loadCourseStep = createStep({
  id: 'load-course',
  description: 'Load and combine all course markdown files with metadata extraction',
  inputSchema,
  outputSchema: z.object({
    combinedContent: z.string(),
    anchorList: z.array(z.string()),
    courseMetadata: z.object({
      title: z.string(),
      totalFiles: z.number(),
      totalAnchors: z.number(),
    }),
    fileList: z.array(z.string()),
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

// Step 2: Extract KCs with Basic Agent
const extractKCsStep = createStep({
  id: 'extract-kcs',
  description: 'Extract Knowledge Components using basic KC extraction agent',
  inputSchema: z.object({
    combinedContent: z.string(),
    anchorList: z.array(z.string()),
    courseMetadata: z.object({
      title: z.string(),
      totalFiles: z.number(),
      totalAnchors: z.number(),
    }),
    fileList: z.array(z.string()),
    outDir: z.string(),
    model: z.string(),
  }),
  outputSchema: z.object({
    kcs: KCArraySchema,
    courseMetadata: z.object({
      title: z.string(),
      totalFiles: z.number(),
      totalAnchors: z.number(),
    }),
    outDir: z.string(),
    extractionMetadata: z.object({
      model_used: z.string(),
      prompt_length: z.number(),
      anchors_available: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, model } = inputData;
    
    const agent = createBasicKCExtractorAgent(model);
    const prompt = createKCExtractionPrompt(
      combinedContent,
      anchorList,
      courseMetadata.title
    );
    
    const response = await agent.generate(
      [{ role: 'user', content: prompt }],
      { output: KCArraySchema }
    );
    
    const kcs = response.object;
    if (!kcs) {
      throw new Error('Agent did not produce structured KC output');
    }
    
    // Add some basic validation and auto-generated IDs if missing
    const validatedKCs = kcs.map((kc, index) => ({
      ...kc,
      kc_id: kc.kc_id || `KC-01-${String(index + 1).padStart(3, '0')}`,
      anchors: kc.anchors || ['P-001'], // Default anchor if none provided
    }));
    
    return {
      kcs: validatedKCs,
      courseMetadata,
      outDir: inputData.outDir,
      extractionMetadata: {
        model_used: model,
        prompt_length: prompt.length,
        anchors_available: anchorList.length,
      },
    };
  },
});

// Step 3: Return Results (No File Saving)
const generateOutputStep = createStep({
  id: 'generate-output',
  description: 'Return extracted KCs directly in the workflow result for easy copying',
  inputSchema: z.object({
    kcs: KCArraySchema,
    courseMetadata: z.object({
      title: z.string(),
      totalFiles: z.number(),
      totalAnchors: z.number(),
    }),
    outDir: z.string(),
    extractionMetadata: z.object({
      model_used: z.string(),
      prompt_length: z.number(),
      anchors_available: z.number(),
    }),
  }),
  outputSchema,
  execute: async ({ inputData }) => {
    const { kcs, courseMetadata, extractionMetadata } = inputData;
    
    // Just return the data directly - no file saving needed!
    return {
      written: [], // No files written
      summary: {
        totalKCs: kcs.length,
        validKCs: kcs.filter(kc => kc.anchors && kc.anchors.length > 0).length,
        outputFiles: [], // No files generated
      },
      // Include the actual extracted data for easy copying
      kcs: kcs,
      courseMetadata: courseMetadata,
      extractionMetadata: extractionMetadata,
    };
  },
});

// Create the Phase 1 workflow
const workflow = createWorkflow({
  id: 'kc-multi-agent-phase1',
  description: 'Phase 1: Basic KC extraction workflow with foundational Mastra patterns',
  inputSchema,
  outputSchema,
})
  .then(loadCourseStep)
  .then(extractKCsStep)
  .then(generateOutputStep);

workflow.commit();

export { workflow as kcMultiAgentWorkflow };
