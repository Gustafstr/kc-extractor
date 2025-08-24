import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { pythonPdfConverterTool } from '../tools/python-pdf-converter.tool';
import { courseLoaderTool } from '../tools/course-loader.tool';
import { kcResultsExportTool } from '../tools/kc-results-export.tool';
import { evaluationReportExportTool } from '../tools/evaluation-report-export.tool';
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
import { AnswerRelevancyMetric } from '@mastra/evals/llm';

// Workflow input schema - now includes PDF processing and separate models
const inputSchema = z.object({
  pdfDir: z.string().default('src/mastra/Input/PDFs').describe('Directory containing PDF files to convert'),
  markdownDir: z.string().default('src/mastra/Input/Converted').describe('Directory to store converted markdown files'),
  outDir: z.string().default('out'),
  extractionModel: z.string().default('gemini-2.5-pro').describe('Model for KC extraction agents (atomicity, anchors, assessment, bloom, consolidation)'),
  evaluationModel: z.string().default('gemini-2.5-flash-lite').describe('Model for quality evaluation metrics (faithfulness, hallucination, relevancy)'),
  courseTitle: z.string().default('Course Knowledge Components'),
  datalabApiKey: z.string().optional().describe('Datalab API key for PDF conversion (optional if skipConversion is true)'),
  skipConversion: z.boolean().default(false).describe('Skip PDF conversion and use existing markdown files'),
});

// Enhanced output schema with PDF conversion metadata
const outputSchema = z.object({
  written: z.array(z.string()),
  summary: z.object({
    totalKCs: z.number(),
    validKCs: z.number(),
    outputFiles: z.array(z.string()),
    pdfConversions: z.number(),
    kcResultsExport: z.object({
      filePath: z.string(),
      sheetsCreated: z.array(z.string()),
      totalKCs: z.number(),
    }).optional(),
    evaluationReport: z.object({
      filePath: z.string(),
      sheetsCreated: z.array(z.string()),
      overallGrade: z.string(),
      overallScore: z.number(),
    }).optional(),
  }),
  finalKCs: KCArraySchema,
  courseMetadata: z.object({
    title: z.string(),
    totalFiles: z.number(),
    totalAnchors: z.number(),
    convertedPdfs: z.number(),
  }),
  extractionMetadata: z.object({
    extraction_model: z.string(),
    evaluation_model: z.string(),
    phase: z.string(),
    parallel_agents: z.number(),
    total_processing_time: z.number(),
    pdf_conversion_time: z.number(),
    agent_contributions: z.object({
      atomicity: z.number(),
      anchors: z.number(),
      assessment: z.number(),
      bloom: z.number(),
    }),
  }),
  // Evaluation results
  evaluationResults: z.object({
    faithfulness: z.object({
      score: z.number(),
      reason: z.string(),
    }),
    hallucination: z.object({
      score: z.number(),
      reason: z.string(),
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

// Step 0: PDF to Markdown Conversion
const pdfConversionStep = createStep({
  id: 'pdf-conversion',
  description: 'Convert PDF files to Markdown using Datalab API',
  inputSchema,
  outputSchema: z.object({
    convertedFiles: z.array(z.object({
      originalPath: z.string(),
      markdownPath: z.string(),
      fileName: z.string(),
    })),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
    markdownDir: z.string(),
    outDir: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { pdfDir, markdownDir, outDir, extractionModel, evaluationModel, courseTitle, datalabApiKey, skipConversion } = inputData;
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Resolve paths relative to project root (go up from .mastra/output if needed)
    const projectRoot = process.cwd().includes('.mastra') 
      ? path.resolve(process.cwd(), '../..') 
      : process.cwd();
    const absolutePdfDir = path.resolve(projectRoot, pdfDir);
    const absoluteMarkdownDir = path.resolve(projectRoot, markdownDir);
    
    if (skipConversion) {
      console.log(`🔄 Skipping PDF conversion - using existing markdown files from ${absoluteMarkdownDir}`);
      
      // Check if markdown directory exists
      if (!fs.existsSync(absoluteMarkdownDir)) {
        throw new Error(`Markdown directory does not exist: ${absoluteMarkdownDir}. Cannot skip conversion.`);
      }
      
      // Get list of existing markdown files
      const markdownFiles = fs.readdirSync(absoluteMarkdownDir)
        .filter(file => file.toLowerCase().endsWith('.md'));
      
      if (markdownFiles.length === 0) {
        throw new Error(`No markdown files found in ${absoluteMarkdownDir}. Cannot skip conversion.`);
      }
      
      console.log(`📄 Found ${markdownFiles.length} existing markdown files`);
      
      // Create converted files list from existing markdown files
      const convertedFiles: Array<{
        originalPath: string;
        markdownPath: string;
        fileName: string;
      }> = [];
      
      for (const mdFile of markdownFiles) {
        const fileName = path.basename(mdFile, '.md');
        const markdownPath = path.join(absoluteMarkdownDir, mdFile);
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        convertedFiles.push({
          originalPath: `${fileName}.pdf`, // Assumed original PDF name
          markdownPath: markdownPath,
          fileName,
        });
        
        console.log(`✅ Using existing: ${fileName}.md (${markdownContent.length} chars)`);
      }
      
      return {
        convertedFiles,
        conversionMetadata: {
          totalPdfs: markdownFiles.length,
          successfulConversions: markdownFiles.length,
          totalConversionTime: 0, // No conversion time since we skipped it
        },
        markdownDir,
        outDir,
        extractionModel,
        evaluationModel,
        courseTitle,
      };
    }
    
    console.log(`🔄 Starting PDF conversion from ${absolutePdfDir} to ${absoluteMarkdownDir}`);
    
    // Check if PDF directory exists
    if (!fs.existsSync(absolutePdfDir)) {
      throw new Error(`PDF directory does not exist: ${absolutePdfDir}`);
    }
    
    // Ensure markdown directory exists
    if (!fs.existsSync(absoluteMarkdownDir)) {
      fs.mkdirSync(absoluteMarkdownDir, { recursive: true });
    }
    
    // Find all PDF files in the input directory
    const pdfFiles = fs.readdirSync(absolutePdfDir)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => path.join(absolutePdfDir, file));
    
    if (pdfFiles.length === 0) {
      console.log('⚠️ No PDF files found in the input directory');
      return {
        convertedFiles: [],
        conversionMetadata: {
          totalPdfs: 0,
          successfulConversions: 0,
          totalConversionTime: 0,
        },
        markdownDir,
        outDir,
        extractionModel,
        evaluationModel,
        courseTitle,
      };
    }
    
    console.log(`📄 Found ${pdfFiles.length} PDF files to convert`);
    
    const convertedFiles: Array<{
      originalPath: string;
      markdownPath: string;
      fileName: string;
    }> = [];
    
    const startTime = Date.now();
    let successfulConversions = 0;
    
    // Convert each PDF file
    for (const pdfPath of pdfFiles) {
      try {
        const fileName = path.basename(pdfPath, '.pdf');
        const markdownPath = path.join(absoluteMarkdownDir, `${fileName}.md`);
        
        // Check if markdown file already exists
        if (fs.existsSync(markdownPath)) {
          console.log(`📄 Using existing markdown: ${fileName}.md`);
          
          // Read existing file to get metadata
          const markdownContent = fs.readFileSync(markdownPath, 'utf8');
          const fileStats = fs.statSync(markdownPath);
          
          convertedFiles.push({
            originalPath: pdfPath,
            markdownPath: markdownPath,
            fileName,
          });
          
          console.log(`✅ Reusing existing: ${fileName}.pdf → ${fileName}.md (${markdownContent.length} chars)`);
          successfulConversions++;
          
        } else {
          console.log(`🔄 Converting: ${fileName}.pdf`);
          
          // Use the PDF converter tool
          if (!datalabApiKey) {
            throw new Error('Datalab API key is required for PDF conversion');
          }
          
          const conversionResult = await pythonPdfConverterTool.execute({
            context: {
              pdfFilePath: pdfPath,
              outputPath: markdownPath,
              datalabApiKey,
            },
            mastra,
            runtimeContext: undefined as any,
          });
          
          convertedFiles.push({
            originalPath: pdfPath,
            markdownPath: conversionResult.outputFilePath,
            fileName,
          });
          
          successfulConversions++;
          console.log(`✅ Successfully converted: ${fileName}.pdf → ${fileName}.md`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to convert ${path.basename(pdfPath)}:`, error);
        // Continue with other files even if one fails
      }
    }
    
    const totalConversionTime = Date.now() - startTime;
    
    console.log(`🎉 PDF conversion completed: ${successfulConversions}/${pdfFiles.length} files converted in ${totalConversionTime}ms`);
    
    return {
      convertedFiles,
      conversionMetadata: {
        totalPdfs: pdfFiles.length,
        successfulConversions,
        totalConversionTime,
      },
      markdownDir,
      outDir,
      extractionModel,
      evaluationModel,
      courseTitle,
    };
  },
});

// Course loader output schema (updated for full-circle)
const courseLoaderOutputSchema = z.object({
  combinedContent: z.string(),
  anchorList: z.array(z.string()),
  courseMetadata: z.object({
    title: z.string(),
    totalFiles: z.number(),
    totalAnchors: z.number(),
    convertedPdfs: z.number(),
  }),
  fileList: z.array(z.string()),
});

// Step 1: Load Course Materials (now from converted markdown)
const loadCourseStep = createStep({
  id: 'load-course',
  description: 'Load and combine all converted markdown files with metadata extraction',
  inputSchema: z.object({
    convertedFiles: z.array(z.object({
      originalPath: z.string(),
      markdownPath: z.string(),
      fileName: z.string(),
    })),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
    markdownDir: z.string(),
    outDir: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
  }),
  outputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  execute: async ({ inputData, mastra }) => {
    const { markdownDir, conversionMetadata, outDir, extractionModel, evaluationModel, courseTitle } = inputData;
    
    console.log(`📚 Loading course materials from converted markdown files in ${markdownDir}`);
    
    // Use the course loader tool on the converted markdown directory
    const result = await courseLoaderTool.execute({
      context: { dir: markdownDir },
      mastra,
      runtimeContext: undefined as any,
    });

    // Update course metadata to include PDF conversion info
    const updatedCourseMetadata = {
      ...result.courseMetadata,
      convertedPdfs: conversionMetadata.successfulConversions,
    };

    return {
      ...result,
      courseMetadata: updatedCourseMetadata,
      outDir,
      extractionModel,
      evaluationModel,
      courseTitle,
      conversionMetadata,
    };
  },
});

// The rest of the steps are identical to the phase3 workflow but with updated schemas
// Step 2a: Atomicity Agent Extraction
const atomicityExtractionStep = createStep({
  id: 'atomicity-extraction',
  description: 'Extract atomic, single-concept Knowledge Components',
  inputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  outputSchema: z.object({
    atomicityKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    combinedContent: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, extractionModel, evaluationModel, courseTitle, conversionMetadata } = inputData;

    const atomicityAgent = createAtomicityAgent(extractionModel);
    const atomicityPrompt = createAtomicityPrompt(combinedContent, anchorList, courseTitle);

    console.log(`🤖 Running Atomicity Agent with ${extractionModel}`);
    console.log(`📝 Content length: ${combinedContent.length} chars, Anchors: ${anchorList.length}`);

    try {
      const atomicityResult = await retryAgentGenerate(
        () => atomicityAgent.generate(
          [{ role: 'user', content: atomicityPrompt }],
          { output: KCArraySchema }
        )
      );

      console.log(`✅ Atomicity Agent extracted ${atomicityResult.object?.length || 0} KCs`);

      return {
        atomicityKCs: atomicityResult.object || [],
        courseMetadata,
        anchorList,
        combinedContent,
        extractionModel,
        evaluationModel,
        courseTitle,
        conversionMetadata,
      };
    } catch (error) {
      console.error(`❌ Atomicity Agent failed:`, error);
      console.error(`📝 Prompt length: ${atomicityPrompt.length} characters`);
      
      // Return empty array to allow workflow to continue
      return {
        atomicityKCs: [],
        courseMetadata,
        anchorList,
        combinedContent,
        extractionModel,
        evaluationModel,
        courseTitle,
        conversionMetadata,
      };
    }
  },
});

// Step 2b: Anchors Agent Extraction
const anchorsExtractionStep = createStep({
  id: 'anchors-extraction',
  description: 'Extract evidence-based Knowledge Components with strong anchor support',
  inputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  outputSchema: z.object({
    anchorsKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    combinedContent: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, extractionModel, evaluationModel, courseTitle, conversionMetadata } = inputData;

    const anchorsAgent = createAnchorsAgent(extractionModel);
    const anchorsPrompt = createAnchorsPrompt(combinedContent, anchorList, courseTitle);

    console.log(`🤖 Running Anchors Agent with ${extractionModel}`);

    try {
      const anchorsResult = await retryAgentGenerate(
        () => anchorsAgent.generate(
          [{ role: 'user', content: anchorsPrompt }],
          { output: KCArraySchema }
        )
      );

      console.log(`✅ Anchors Agent extracted ${anchorsResult.object?.length || 0} KCs`);

      return {
        anchorsKCs: anchorsResult.object || [],
        courseMetadata,
        anchorList,
        combinedContent,
        extractionModel,
        evaluationModel,
        courseTitle,
        conversionMetadata,
      };
    } catch (error) {
      console.error(`❌ Anchors Agent failed:`, error);
      
      return {
        anchorsKCs: [],
        courseMetadata,
        anchorList,
        combinedContent,
        extractionModel,
        evaluationModel,
        courseTitle,
        conversionMetadata,
      };
    }
  },
});

// Step 2c: Assessment Agent Extraction
const assessmentExtractionStep = createStep({
  id: 'assessment-extraction',
  description: 'Extract testable Knowledge Components with concrete assessment examples',
  inputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  outputSchema: z.object({
    assessmentKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    combinedContent: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, extractionModel, evaluationModel, courseTitle, conversionMetadata } = inputData;

    const assessmentAgent = createAssessmentAgent(extractionModel);
    const assessmentPrompt = createAssessmentPrompt(combinedContent, anchorList, courseTitle);

    console.log(`🤖 Running Assessment Agent with ${extractionModel}`);

    try {
      const assessmentResult = await retryAgentGenerate(
        () => assessmentAgent.generate(
          [{ role: 'user', content: assessmentPrompt }],
          { output: KCArraySchema }
        )
      );

      console.log(`✅ Assessment Agent extracted ${assessmentResult.object?.length || 0} KCs`);

      return {
        assessmentKCs: assessmentResult.object || [],
        courseMetadata,
        anchorList,
        combinedContent,
        extractionModel,
        evaluationModel,
        courseTitle,
        conversionMetadata,
      };
    } catch (error) {
      console.error(`❌ Assessment Agent failed:`, error);
      
      return {
        assessmentKCs: [],
        courseMetadata,
        anchorList,
        combinedContent,
        extractionModel,
        evaluationModel,
        courseTitle,
        conversionMetadata,
      };
    }
  },
});

// Step 2d: Bloom Agent Extraction
const bloomExtractionStep = createStep({
  id: 'bloom-extraction',
  description: 'Extract Knowledge Components with accurate Bloom taxonomy classification',
  inputSchema: courseLoaderOutputSchema.extend({
    outDir: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  outputSchema: z.object({
    bloomKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    anchorList: z.array(z.string()),
    combinedContent: z.string(),
    extractionModel: z.string(),
    evaluationModel: z.string(),
    courseTitle: z.string(),
    conversionMetadata: z.object({
      totalPdfs: z.number(),
      successfulConversions: z.number(),
      totalConversionTime: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { combinedContent, anchorList, courseMetadata, extractionModel, evaluationModel, courseTitle, conversionMetadata } = inputData;

    const bloomAgent = createBloomAgent(extractionModel);
    const bloomPrompt = createBloomPrompt(combinedContent, anchorList, courseTitle);

    console.log(`🤖 Running Bloom Agent with ${extractionModel}`);

    const bloomResult = await retryAgentGenerate(
      () => bloomAgent.generate(
        [{ role: 'user', content: bloomPrompt }],
        { output: KCArraySchema }
      )
    );

    console.log(`✅ Bloom Agent extracted ${bloomResult.object?.length || 0} KCs`);

    return {
      bloomKCs: bloomResult.object || [],
      courseMetadata,
      anchorList,
      combinedContent,
      extractionModel,
      evaluationModel,
      courseTitle,
      conversionMetadata,
    };
  },
});

// Step 3: Master Consolidation (updated for full-circle)
const masterConsolidationStep = createStep({
  id: 'master-consolidation',
  description: 'Consolidate all agent outputs into final, deduplicated KC set',
  inputSchema: z.object({
    'atomicity-extraction': z.object({
      atomicityKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      extractionModel: z.string(),
    evaluationModel: z.string(),
      courseTitle: z.string(),
      conversionMetadata: z.object({
        totalPdfs: z.number(),
        successfulConversions: z.number(),
        totalConversionTime: z.number(),
      }),
    }),
    'anchors-extraction': z.object({
      anchorsKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      extractionModel: z.string(),
    evaluationModel: z.string(),
      courseTitle: z.string(),
      conversionMetadata: z.object({
        totalPdfs: z.number(),
        successfulConversions: z.number(),
        totalConversionTime: z.number(),
      }),
    }),
    'assessment-extraction': z.object({
      assessmentKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      extractionModel: z.string(),
    evaluationModel: z.string(),
      courseTitle: z.string(),
      conversionMetadata: z.object({
        totalPdfs: z.number(),
        successfulConversions: z.number(),
        totalConversionTime: z.number(),
      }),
    }),
    'bloom-extraction': z.object({
      bloomKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      anchorList: z.array(z.string()),
      combinedContent: z.string(),
      extractionModel: z.string(),
    evaluationModel: z.string(),
      courseTitle: z.string(),
      conversionMetadata: z.object({
        totalPdfs: z.number(),
        successfulConversions: z.number(),
        totalConversionTime: z.number(),
      }),
    }),
  }),
  outputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    combinedContent: z.string(),
    anchorList: z.array(z.string()),
    courseTitle: z.string(),
    extractionMetadata: z.object({
      extraction_model: z.string(),
    evaluation_model: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      pdf_conversion_time: z.number(),
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
    const { courseMetadata, anchorList, combinedContent, extractionModel, evaluationModel, courseTitle, conversionMetadata } = inputData['atomicity-extraction'];

    console.log(`🤖 Running Master Consolidator Agent with ${extractionModel}`);
    console.log(`📊 Consolidating KCs: Atomicity(${atomicityKCs.length}), Anchors(${anchorsKCs.length}), Assessment(${assessmentKCs.length}), Bloom(${bloomKCs.length})`);

    // Create master consolidator agent
    const masterAgent = createMasterConsolidatorAgent(extractionModel);
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
    
    console.log(`✅ Master Consolidator produced ${finalKCs.length} final KCs`);

    return {
      finalKCs,
      courseMetadata,
      combinedContent,
      anchorList,
      courseTitle,
      extractionMetadata: {
        extraction_model: extractionModel,
        evaluation_model: evaluationModel,
        phase: 'Full Circle - PDF to KC Extraction with Quality Evaluation',
        parallel_agents: 4,
        total_processing_time: 0, // Will be calculated by Mastra
        pdf_conversion_time: conversionMetadata.totalConversionTime,
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

// Step 3.5: KC Results Export (after master consolidation, before evaluation)
const kcResultsExportStep = createStep({
  id: 'kc-results-export',
  description: 'Export KC results to Excel format for immediate review',
  inputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    combinedContent: z.string(),
    anchorList: z.array(z.string()),
    courseTitle: z.string(),
    extractionMetadata: z.object({
      extraction_model: z.string(),
    evaluation_model: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      pdf_conversion_time: z.number(),
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
    combinedContent: z.string(),
    anchorList: z.array(z.string()),
    courseTitle: z.string(),
    extractionMetadata: z.object({
      extraction_model: z.string(),
    evaluation_model: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      pdf_conversion_time: z.number(),
      agent_contributions: z.object({
        atomicity: z.number(),
        anchors: z.number(),
        assessment: z.number(),
        bloom: z.number(),
      }),
    }),
    kcResultsExport: z.object({
      filePath: z.string(),
      sheetsCreated: z.array(z.string()),
      totalKCs: z.number(),
    }),
  }),
  execute: async ({ inputData, mastra }) => {
    const { finalKCs, courseMetadata, extractionMetadata, courseTitle } = inputData;

    const path = await import('path');
    
    // Generate KC Results Excel file path with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // Resolve paths relative to project root (go up from .mastra/output if needed)
    const projectRoot = process.cwd().includes('.mastra') 
      ? path.resolve(process.cwd(), '../..') 
      : process.cwd();
    const outputPath = path.resolve(projectRoot, `out/KC-Results-${timestamp}.xlsx`);

    console.log(`📊 Exporting ${finalKCs.length} KCs to Excel format (KC Results)...`);

    // Use the KC Results export tool
    const kcResultsExport = await kcResultsExportTool.execute({
      context: {
        finalKCs,
        courseMetadata,
        extractionMetadata,
        courseTitle,
        outputPath,
      },
      mastra,
      runtimeContext: undefined as any,
    });

    console.log(`✅ KC Results Excel ready: ${outputPath}`);
    console.log(`📋 You can now open and review the KC results while evaluation continues...`);

    return {
      ...inputData,
      kcResultsExport,
    };
  },
});

// Common input schema for all evaluation steps (updated)
const evaluationInputSchema = z.object({
  finalKCs: KCArraySchema,
  courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
  combinedContent: z.string(),
  anchorList: z.array(z.string()),
  courseTitle: z.string(),
  extractionMetadata: z.object({
    extraction_model: z.string(),
    evaluation_model: z.string(),
    phase: z.string(),
    parallel_agents: z.number(),
    total_processing_time: z.number(),
    pdf_conversion_time: z.number(),
    agent_contributions: z.object({
      atomicity: z.number(),
      anchors: z.number(),
      assessment: z.number(),
      bloom: z.number(),
    }),
  }),
  kcResultsExport: z.object({
    filePath: z.string(),
    sheetsCreated: z.array(z.string()),
    totalKCs: z.number(),
  }),
});

// Step 4a: Faithfulness Evaluation (same as phase3 but with updated schema)
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
    anchorList: z.array(z.string()),
    courseTitle: z.string(),
    extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
    kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
  }),
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, combinedContent, extractionMetadata, courseTitle } = inputData;

    // Create evaluation model
    const evalModel = google(extractionMetadata.evaluation_model.replace('google:', ''));

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

    console.log('📊 Running faithfulness evaluation...');
    console.log(`   Context size: ${combinedContent.length} characters`);
    console.log(`   KC summary size: ${kcSummary.length} characters`);
    console.log(`   Number of KCs: ${finalKCs.length}`);
    console.log(`   Estimated tokens: ~${Math.ceil((combinedContent.length + kcSummary.length) / 4)} tokens`);

    try {
      // Run faithfulness evaluation with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Faithfulness evaluation timeout after 2 minutes')), 120000)
      );
      
      console.log('   ⏳ Calling faithfulness API...');
      const startTime = Date.now();
      
      // Progress indicator
      const progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`   ⏳ Still waiting for faithfulness API... (${elapsed}s elapsed)`);
      }, 10000); // Log every 10 seconds
      
      const faithfulnessResult = await Promise.race([
        faithfulnessMetric.measure(courseQuery, kcSummary),
        timeoutPromise
      ]) as any;
      
      clearInterval(progressInterval);
      
      const duration = Date.now() - startTime;
      console.log(`   ⏱️ Faithfulness API responded in ${duration}ms`);

      console.log(`✅ Faithfulness score: ${faithfulnessResult.score.toFixed(3)}`);

      return {
        faithfulnessResult: {
          score: faithfulnessResult.score,
          reason: faithfulnessResult.info.reason,
        },
        finalKCs,
        courseMetadata,
        combinedContent,
        anchorList: inputData.anchorList,
        courseTitle,
        extractionMetadata,
        kcResultsExport: inputData.kcResultsExport,
      };
    } catch (error) {
      console.error('❌ Faithfulness evaluation failed:', error);
      // Return a default score on error
      return {
        faithfulnessResult: {
          score: 0.5,
          reason: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using default score.`,
        },
        finalKCs,
        courseMetadata,
        combinedContent,
        anchorList: inputData.anchorList,
        courseTitle,
        extractionMetadata,
        kcResultsExport: inputData.kcResultsExport,
      };
    }
  },
});

// Step 4b: Hallucination Evaluation (same as phase3 but with updated schema)
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
    anchorList: z.array(z.string()),
    courseTitle: z.string(),
    extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
    kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
  }),
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, combinedContent, extractionMetadata, courseTitle } = inputData;

    // Create evaluation model
    const evalModel = google(extractionMetadata.evaluation_model.replace('google:', ''));

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

    console.log('📊 Running hallucination evaluation...');
    console.log(`   Context size: ${combinedContent.length} characters`);
    console.log(`   KC summary size: ${kcSummary.length} characters`);
    console.log(`   Number of KCs: ${finalKCs.length}`);
    console.log(`   Estimated tokens: ~${Math.ceil((combinedContent.length + kcSummary.length) / 4)} tokens`);

    try {
      // Run hallucination evaluation with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Hallucination evaluation timeout after 2 minutes')), 120000)
      );
      
      console.log('   ⏳ Calling hallucination API...');
      const startTime = Date.now();
      
      const hallucinationResult = await Promise.race([
        hallucinationMetric.measure(courseQuery, kcSummary),
        timeoutPromise
      ]) as any;
      
      const duration = Date.now() - startTime;
      console.log(`   ⏱️ Hallucination API responded in ${duration}ms`);

      console.log(`✅ Hallucination score: ${hallucinationResult.score.toFixed(3)}`);

      return {
        hallucinationResult: {
          score: hallucinationResult.score,
          reason: hallucinationResult.info.reason,
        },
        finalKCs,
        courseMetadata,
        combinedContent,
        anchorList: inputData.anchorList,
        courseTitle,
        extractionMetadata,
        kcResultsExport: inputData.kcResultsExport,
      };
    } catch (error) {
      console.error('❌ Hallucination evaluation failed:', error);
      // Return a default score on error
      return {
        hallucinationResult: {
          score: 0.5,
          reason: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using default score.`,
        },
        finalKCs,
        courseMetadata,
        combinedContent,
        anchorList: inputData.anchorList,
        courseTitle,
        extractionMetadata,
        kcResultsExport: inputData.kcResultsExport,
      };
    }
  },
});



// Step 4d: Answer Relevancy Evaluation (same as phase3 but with updated schema)
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
    anchorList: z.array(z.string()),
    courseTitle: z.string(),
    extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
    kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
  }),
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, combinedContent, extractionMetadata, courseTitle } = inputData;

    // Create evaluation model
    const evalModel = google(extractionMetadata.evaluation_model.replace('google:', ''));

    // Initialize answer relevancy metric
    const answerRelevancyMetric = new AnswerRelevancyMetric(evalModel, {
      scale: 1,
    });

    // Prepare KC content for evaluation
    const kcSummary = finalKCs.map(kc => 
      `${kc.label}: ${kc.definition} (Bloom: ${kc.bloom}, Anchors: ${kc.anchors.join(', ')})`
    ).join('\n');

    const courseQuery = `Extract knowledge components from the course "${courseTitle}"`;

    console.log('📊 Running answer relevancy evaluation...');
    console.log(`   Context size: ${combinedContent.length} characters`);
    console.log(`   KC summary size: ${kcSummary.length} characters`);

    try {
      // Run answer relevancy evaluation with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Faithfulness evaluation timeout after 2 minutes')), 120000)
      );
      
      const answerRelevancyResult = await Promise.race([
        answerRelevancyMetric.measure(courseQuery, kcSummary),
        timeoutPromise
      ]) as any;

      console.log(`✅ Answer relevancy score: ${answerRelevancyResult.score.toFixed(3)}`);

      return {
        answerRelevancyResult: {
          score: answerRelevancyResult.score,
          reason: answerRelevancyResult.info.reason,
        },
        finalKCs,
        courseMetadata,
        combinedContent,
        anchorList: inputData.anchorList,
        courseTitle,
        extractionMetadata,
        kcResultsExport: inputData.kcResultsExport,
      };
    } catch (error) {
      console.error('❌ Answer relevancy evaluation failed:', error);
      // Return a default score on error
      return {
        answerRelevancyResult: {
          score: 0.5,
          reason: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using default score.`,
        },
        finalKCs,
        courseMetadata,
        combinedContent,
        anchorList: inputData.anchorList,
        courseTitle,
        extractionMetadata,
        kcResultsExport: inputData.kcResultsExport,
      };
    }
  },
});

// Step 5: Consolidate Evaluation Results (updated to exclude completeness)
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
      anchorList: z.array(z.string()),
      courseTitle: z.string(),
      extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
      kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
    }),
    'hallucination-evaluation': z.object({
      hallucinationResult: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      finalKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      combinedContent: z.string(),
      anchorList: z.array(z.string()),
      courseTitle: z.string(),
      extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
      kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
    }),
    'answer-relevancy-evaluation': z.object({
      answerRelevancyResult: z.object({
        score: z.number(),
        reason: z.string(),
      }),
      finalKCs: KCArraySchema,
      courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
      combinedContent: z.string(),
      anchorList: z.array(z.string()),
      courseTitle: z.string(),
      extractionMetadata: evaluationInputSchema.shape.extractionMetadata,
      kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
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
    kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
  }),
  execute: async ({ inputData }) => {
    // Extract results from all parallel evaluation steps
    const faithfulnessResult = inputData['faithfulness-evaluation'].faithfulnessResult;
    const hallucinationResult = inputData['hallucination-evaluation'].hallucinationResult;
    const answerRelevancyResult = inputData['answer-relevancy-evaluation'].answerRelevancyResult;

    // Get metadata from first result (all should be the same)
    const { finalKCs, courseMetadata, extractionMetadata, kcResultsExport } = inputData['faithfulness-evaluation'];

    // Calculate overall quality score (average of 3 metrics)
    // Note: Hallucination is inverted (lower is better), so we use (1 - score)
    const overallScore = (
      faithfulnessResult.score +
      (1 - hallucinationResult.score) +
      answerRelevancyResult.score
    ) / 3;

    // Assign grade based on overall score
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 0.9) grade = 'A';
    else if (overallScore >= 0.8) grade = 'B';
    else if (overallScore >= 0.7) grade = 'C';
    else if (overallScore >= 0.6) grade = 'D';
    else grade = 'F';

    const passThreshold = overallScore >= 0.7; // 70% threshold

    console.log(`🎯 Overall Quality Score: ${overallScore.toFixed(3)} (Grade: ${grade})`);
    console.log(`📊 Evaluation Summary:`);
    console.log(`  - Faithfulness: ${faithfulnessResult.score.toFixed(3)}`);
    console.log(`  - Hallucination: ${hallucinationResult.score.toFixed(3)} (inverted: ${(1-hallucinationResult.score).toFixed(3)})`);
    console.log(`  - Answer Relevancy: ${answerRelevancyResult.score.toFixed(3)}`);
    console.log(`  - Pass Threshold (70%): ${passThreshold ? '✅ PASS' : '❌ FAIL'}`);

    return {
      finalKCs,
      courseMetadata,
      extractionMetadata,
      evaluationResults: {
        faithfulness: faithfulnessResult,
        hallucination: hallucinationResult,
        answerRelevancy: answerRelevancyResult,
        overallQuality: {
          score: overallScore,
          grade,
          passThreshold,
        },
      },
      kcResultsExport,
    };
  },
});

// Step 6: Evaluation Report Export
const evaluationReportExportStep = createStep({
  id: 'evaluation-report-export',
  description: 'Export evaluation results and quality metrics to Excel format',
  inputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    extractionMetadata: z.object({
      extraction_model: z.string(),
    evaluation_model: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      pdf_conversion_time: z.number(),
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
    kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
  }),
  outputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    extractionMetadata: z.object({
      extraction_model: z.string(),
    evaluation_model: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      pdf_conversion_time: z.number(),
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
    excelExport: z.object({
      filePath: z.string(),
      sheetsCreated: z.array(z.string()),
      overallGrade: z.string(),
      overallScore: z.number(),
    }),
    kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
  }),
  execute: async ({ inputData, mastra }) => {
    const { finalKCs, courseMetadata, extractionMetadata, evaluationResults, kcResultsExport } = inputData;

    const path = await import('path');
    
    // Generate Evaluation Report Excel file path with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // Resolve paths relative to project root (go up from .mastra/output if needed)
    const projectRoot = process.cwd().includes('.mastra') 
      ? path.resolve(process.cwd(), '../..') 
      : process.cwd();
    const outputPath = path.resolve(projectRoot, `out/Evaluation-Report-${timestamp}.xlsx`);

    console.log(`📊 Exporting evaluation results and quality metrics to Excel format...`);

    // Use the Evaluation Report export tool
    const evaluationReport = await evaluationReportExportTool.execute({
      context: {
        finalKCs,
        courseMetadata,
        extractionMetadata,
        evaluationResults,
        courseTitle: courseMetadata.title || 'Course Knowledge Components',
        outputPath,
      },
      mastra,
      runtimeContext: undefined as any,
    });

    return {
      finalKCs,
      courseMetadata,
      extractionMetadata,
      evaluationResults,
      excelExport: evaluationReport,
      kcResultsExport,
    };
  },
});

// Step 7: Generate Output (with evaluation results, PDF conversion metadata, and Excel export)
const generateOutputStep = createStep({
  id: 'generate-output',
  description: 'Return consolidated KCs with evaluation results, PDF conversion metadata, and Excel export info',
  inputSchema: z.object({
    finalKCs: KCArraySchema,
    courseMetadata: courseLoaderOutputSchema.shape.courseMetadata,
    extractionMetadata: z.object({
      extraction_model: z.string(),
    evaluation_model: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      pdf_conversion_time: z.number(),
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
    excelExport: z.object({
      filePath: z.string(),
      sheetsCreated: z.array(z.string()),
      overallGrade: z.string(),
      overallScore: z.number(),
    }),
    kcResultsExport: evaluationInputSchema.shape.kcResultsExport,
  }),
  outputSchema,
  execute: async ({ inputData }) => {
    const { finalKCs, courseMetadata, extractionMetadata, evaluationResults, excelExport, kcResultsExport } = inputData;

    console.log(`🎉 Full Circle KC Extraction Complete!`);
    console.log(`📄 Processed ${courseMetadata.convertedPdfs} PDF files`);
    console.log(`📚 Generated ${finalKCs.length} final Knowledge Components`);
    console.log(`⏱️ PDF Conversion Time: ${extractionMetadata.pdf_conversion_time}ms`);
    console.log(`🏆 Overall Quality Grade: ${evaluationResults.overallQuality.grade}`);
    console.log(`📊 KC Results Excel: ${kcResultsExport.filePath}`);
    console.log(`📈 Evaluation Report Excel: ${excelExport.filePath}`);

    return {
      written: [],
      summary: {
        totalKCs: finalKCs.length,
        validKCs: finalKCs.filter(kc => kc.anchors && kc.anchors.length > 0).length,
        outputFiles: [kcResultsExport.filePath, excelExport.filePath],
        pdfConversions: courseMetadata.convertedPdfs,
        kcResultsExport: kcResultsExport,
        evaluationReport: {
          filePath: excelExport.filePath,
          sheetsCreated: excelExport.sheetsCreated,
          overallGrade: evaluationResults.overallQuality.grade,
          overallScore: evaluationResults.overallQuality.score,
        },
      },
      finalKCs,
      courseMetadata,
      extractionMetadata,
      evaluationResults,
    };
  },
});

// Create the Full Circle workflow
const workflow = createWorkflow({
  id: 'kc-extraction-full-circle',
  description: 'Full Circle: PDF to KC Extraction - Convert PDFs to markdown using Datalab API, then extract Knowledge Components with multi-agent parallel processing and quality evaluation',
  inputSchema,
  outputSchema,
})
  .then(pdfConversionStep)           // Step 0: Convert PDFs to Markdown
  .then(loadCourseStep)              // Step 1: Load converted markdown files
  .parallel([                        // Step 2: Parallel agent extraction
    atomicityExtractionStep,
    anchorsExtractionStep,
    assessmentExtractionStep,
    bloomExtractionStep,
  ])
  .then(masterConsolidationStep)     // Step 3: Master consolidation
  .then(kcResultsExportStep)         // Step 3.5: Export KC Results (immediate)
  .parallel([                        // Step 4: Parallel evaluation
    faithfulnessEvaluationStep,
    hallucinationEvaluationStep,
    answerRelevancyEvaluationStep,
  ])
  .then(consolidateEvaluationStep)   // Step 5: Consolidate evaluations
  .then(evaluationReportExportStep)  // Step 6: Export Evaluation Report
  .then(generateOutputStep);         // Step 7: Generate final output

workflow.commit();

export { workflow as kcExtractionFullCircleWorkflow };
