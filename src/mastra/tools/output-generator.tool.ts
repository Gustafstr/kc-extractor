import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { KCArraySchema } from '../schemas/kc';

const inputSchema = z.object({
  kcs: KCArraySchema,
  courseMetadata: z.object({
    title: z.string(),
    totalFiles: z.number(),
    totalAnchors: z.number(),
  }),
  outDir: z.string().default('out'),
  evaluationReport: z.any().optional(),
});

const outputSchema = z.object({
  written: z.array(z.string()).describe('List of files written'),
  summary: z.object({
    totalKCs: z.number(),
    validKCs: z.number(),
    outputFiles: z.array(z.string()),
  }),
});

export const outputGeneratorTool = createTool({
  id: 'output-generator',
  description: 'Generate instructor-ready JSON data and evaluation reports',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { kcs, courseMetadata, outDir, evaluationReport } = context;
    
    // Ensure output directory exists
    await fs.mkdir(outDir, { recursive: true });
    
    const writtenFiles: string[] = [];
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 1. Generate structured JSON file
    const safeTitle = courseMetadata.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars but keep spaces
      .replace(/\s+/g, '_')        // Replace spaces with underscores
      .substring(0, 50);           // Limit length
    
    const jsonFilename = `${safeTitle}_kcs_${timestamp}.json`;
    const jsonPath = path.join(outDir, jsonFilename);
    
    const jsonOutput = {
      metadata: {
        course_title: courseMetadata.title,
        extraction_date: new Date().toISOString(),
        total_files_processed: courseMetadata.totalFiles,
        total_anchors_available: courseMetadata.totalAnchors,
        total_kcs_extracted: kcs.length,
      },
      knowledge_components: kcs,
      ...(evaluationReport && { evaluation: evaluationReport }),
    };
    
    try {
      await fs.writeFile(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
      writtenFiles.push(jsonPath);
    } catch (error) {
      throw new Error(`Failed to write KC file: ${error}`);
    }
    
    // 2. Skip Markdown summary generation (removed as requested)
    
    // 3. Generate evaluation report if provided
    if (evaluationReport) {
      const evalFilename = `${safeTitle}_evaluation_${timestamp}.json`;
      const evalPath = path.join(outDir, evalFilename);
      
      try {
        await fs.writeFile(evalPath, JSON.stringify(evaluationReport, null, 2), 'utf-8');
        writtenFiles.push(evalPath);
      } catch (error) {
        throw new Error(`Failed to write evaluation file: ${error}`);
      }
    }
    
    return {
      written: writtenFiles,
      summary: {
        totalKCs: kcs.length,
        validKCs: kcs.filter(kc => kc.anchors && kc.anchors.length > 0).length,
        outputFiles: writtenFiles.map(f => path.basename(f)),
      },
    };
  },
});


