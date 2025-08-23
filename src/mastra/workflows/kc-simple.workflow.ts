import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { KCArraySchema } from '../schemas/kc';
import { createDraftKCsAgent } from '../agents/draft-kcs.agent';
import { writeFilesTool } from '../tools/write-files.tool';

const inputSchema = z.object({
  dir: z.string().default('src/mastra/Input'),
  model: z.string().default('google:gemini-2.5-pro'),
  outDir: z.string().default('out'),
});

const outputSchema = z.object({ written: z.array(z.string()) });

const readFirstMarkdown = createStep({
  id: 'read-first-md',
  description: 'Read the first .md file from dir',
  inputSchema,
  outputSchema: z.object({ combinedMd: z.string(), model: z.string(), outDir: z.string() }),
  execute: async ({ inputData }) => {
    const cwd = process.cwd();
    let baseDir = inputData.dir;
    if (!path.isAbsolute(baseDir)) {
      const primary = path.join(cwd, baseDir);
      try {
        const st = await fs.stat(primary);
        if (st.isDirectory()) {
          baseDir = primary;
        } else {
          throw new Error('not dir');
        }
      } catch {
        const alt = path.join(cwd, '..', '..', baseDir);
        try {
          const st2 = await fs.stat(alt);
          if (st2.isDirectory()) {
            baseDir = alt;
          } else {
            throw new Error('not dir');
          }
        } catch {
          throw new Error(`Directory not found. Tried: ${path.join(cwd, inputData.dir)} and ${path.join(cwd, '..', '..', inputData.dir)}. Provide an absolute path or ensure the directory exists.`);
        }
      }
    }

    const entries = await fs.readdir(baseDir);
    const mdFiles = entries.filter(e => e.toLowerCase().endsWith('.md')).sort();
    if (mdFiles.length === 0) throw new Error(`No .md files found in ${baseDir}`);
    const full = path.join(baseDir, mdFiles[0]);
    const content = await fs.readFile(full, 'utf-8');
    return { combinedMd: content, model: inputData.model, outDir: inputData.outDir };
  },
});

const draftSimple = createStep({
  id: 'draft-simple',
  description: 'Draft KCs from a single markdown blob',
  inputSchema: z.object({ combinedMd: z.string(), model: z.string(), outDir: z.string() }),
  outputSchema: z.object({ kcs: KCArraySchema, outDir: z.string() }),
  execute: async ({ inputData }) => {
    const { combinedMd, model, outDir } = inputData;
    const agent = createDraftKCsAgent(model);
    const prompt = `Extract 10–60 KCs from the course markdown.\nReturn a JSON array of KC objects matching the provided schema.\nUse anchors [\"P-001\"] if unsure.\n\nCourse Markdown:\n${combinedMd}`;
    const res = await agent.generate([{ role: 'user', content: prompt }], { output: KCArraySchema });
    const kcs = res.object;
    if (!kcs) throw new Error('Model did not produce structured output.');
    return { kcs, outDir };
  },
});

const refineKCs = createStep({
  id: 'refine-kcs',
  description: 'Refine and improve KCs using a different model',
  inputSchema: z.object({ kcs: KCArraySchema, outDir: z.string() }),
  outputSchema: z.object({ kcs: KCArraySchema, outDir: z.string() }),
  execute: async ({ inputData }) => {
    const { kcs, outDir } = inputData;
    
    // Use a different model for refinement - let's use OpenAI GPT-4o
    const refineAgent = createDraftKCsAgent('openai:gpt-4o');
    
    const prompt = `You are a KC refinement expert. Review and improve these Knowledge Components:

INSTRUCTIONS:
1. Fix any unclear or overly complex definitions
2. Ensure each KC is atomic (one concept only)
3. Improve example assessments to be more specific
4. Remove any duplicates or near-duplicates
5. Ensure proper Bloom taxonomy levels
6. Keep the same JSON structure

Original KCs to refine:
${JSON.stringify(kcs, null, 2)}

Return the refined KCs as a JSON array with the same structure.`;

    const res = await refineAgent.generate([{ role: 'user', content: prompt }], { output: KCArraySchema });
    const refinedKCs = res.object;
    
    if (!refinedKCs) throw new Error('Refinement model did not produce structured output.');
    
    console.log(`✨ Refined ${kcs.length} → ${refinedKCs.length} KCs using OpenAI GPT-4o`);
    
    return { kcs: refinedKCs, outDir };
  },
});

const writeSimple = createStep({
  id: 'write-simple',
  description: 'Write KCs to disk',
  inputSchema: z.object({ kcs: KCArraySchema, outDir: z.string() }),
  outputSchema,
  execute: async ({ inputData, mastra }) => {
    const res = await writeFilesTool.execute({ context: { outDir: inputData.outDir, kcs: inputData.kcs, evalReport: {}, trace: [] }, mastra, runtimeContext: undefined as any });
    return res;
  },
});

const workflow = createWorkflow({
  id: 'kc-simple',
  inputSchema,
  outputSchema,
})
  .then(readFirstMarkdown)
  .then(draftSimple)
  .then(refineKCs)
  .then(writeSimple);

workflow.commit();

export { workflow as kcSimpleWorkflow };


