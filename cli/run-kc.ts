#!/usr/bin/env node
import 'dotenv/config';
import { kcMultiAgentPhase3Workflow } from '../src/mastra/workflows/kc-multi-agent-phase3.workflow';
import { kcExtractionFullCircleWorkflow } from '../src/mastra/workflows/kc-extraction-full-circle.workflow';

// Available workflows
const workflows = {
  'phase3': kcMultiAgentPhase3Workflow,
  'full-circle': kcExtractionFullCircleWorkflow,
} as const;

type WorkflowName = keyof typeof workflows;

function printUsage() {
  console.log('Usage: npm run kc [workflow] [options...]');
  console.log('');
  console.log('Available workflows:');
  console.log('  phase3        - Multi-agent KC extraction with evaluation (default)');
  console.log('                  Args: [inputDir] [outputDir] [model] [courseTitle]');
  console.log('  full-circle   - PDF to KC extraction with Python Datalab SDK conversion');
  console.log('                  Args: [pdfDir] [markdownDir] [outputDir] [model] [courseTitle] [datalabApiKey]');
  console.log('                  Flags: --skip-conversion (use existing markdown files)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run kc phase3');
  console.log('  npm run kc phase3 src/mastra/Input out google:gemini-2.5-pro');
  console.log('  npm run kc full-circle src/pdfs src/converted out google:gemini-2.5-pro "My Course"');
  console.log('  npm run kc full-circle --skip-conversion  # Use existing markdown files');
  console.log('');
  console.log('Environment Variables:');
  console.log('  DATALAB_API_KEY - Required for full-circle workflow');
  console.log('  GOOGLE_GENERATIVE_AI_API_KEY - Required for Gemini model');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Check for flags
  const skipConversion = args.includes('--skip-conversion');
  
  // Filter out flags to get workflow name and args
  const filteredArgs = args.filter(arg => !arg.startsWith('--'));
  const workflowName = (filteredArgs[0] && filteredArgs[0] in workflows) ? filteredArgs[0] as WorkflowName : 'phase3';
  const workflowArgs = workflowName === filteredArgs[0] ? filteredArgs.slice(1) : filteredArgs;
  
  const workflow = workflows[workflowName];
  
  console.log(`🚀 Running ${workflowName} workflow...`);

  let inputData: any;

  if (workflowName === 'phase3') {
    // Phase 3 workflow parameters
    const inDir = workflowArgs[0] || 'src/mastra/Input';
    const outDir = workflowArgs[1] || 'out';
    const model = workflowArgs[2] || 'google:gemini-2.5-pro';
    const courseTitle = workflowArgs[3] || 'Course Knowledge Components';
    
    inputData = { dir: inDir, outDir, model, courseTitle };
    
    console.log(`📂 Input Directory: ${inDir}`);
    console.log(`📁 Output Directory: ${outDir}`);
    console.log(`🤖 Model: ${model}`);
    console.log(`📚 Course Title: ${courseTitle}`);
    
  } else if (workflowName === 'full-circle') {
    // Full Circle workflow parameters
    const pdfDir = workflowArgs[0] || 'src/mastra/Input/PDFs';
    const markdownDir = workflowArgs[1] || 'src/mastra/Input/Converted';
    const outDir = workflowArgs[2] || 'out';
    const model = workflowArgs[3] || 'google:gemini-2.5-pro';
    const courseTitle = workflowArgs[4] || 'Course Knowledge Components';
    const datalabApiKey = workflowArgs[5] || process.env.DATALAB_API_KEY;
    
    // Only require API key if not skipping conversion
    if (!skipConversion && !datalabApiKey) {
      console.error('❌ Error: Datalab API key is required for PDF conversion.');
      console.error('   Provide it as an argument or set DATALAB_API_KEY environment variable.');
      console.error('   Or use --skip-conversion to use existing markdown files.');
      console.error('   Get your API key from: https://documentation.datalab.to/');
      process.exit(1);
    }
    
    inputData = { pdfDir, markdownDir, outDir, model, courseTitle, datalabApiKey, skipConversion };
    
    console.log(`📄 PDF Directory: ${pdfDir}`);
    console.log(`📝 Markdown Directory: ${markdownDir}`);
    console.log(`📁 Output Directory: ${outDir}`);
    console.log(`🤖 Model: ${model}`);
    console.log(`📚 Course Title: ${courseTitle}`);
    
    if (skipConversion) {
      console.log(`🔄 Conversion: SKIPPED - Using existing markdown files`);
    } else {
      console.log(`📦 PDF Converter: Python Datalab SDK`);
      console.log(`🔑 Datalab API: ${datalabApiKey ? 'Configured' : 'Missing'}`);
    }
  }

  try {
    console.log('');
    console.log('⏳ Starting workflow execution...');
    
    const run = await workflow.createRunAsync();
    const res = await run.start({ inputData });
    
    if ((res as any)?.status !== 'success') {
      throw new Error('Workflow failed: ' + JSON.stringify(res, null, 2));
    }
    
    const result = (res as any).result;
    
    console.log('');
    console.log('🎉 Workflow completed successfully!');
    console.log('');
    
    // Display results based on workflow type
    if (workflowName === 'full-circle') {
      console.log('📊 Full Circle Results:');
      console.log(`  📄 PDFs Converted: ${result.summary?.pdfConversions || 0}`);
      console.log(`  📚 Total KCs: ${result.summary?.totalKCs || 0}`);
      console.log(`  ✅ Valid KCs: ${result.summary?.validKCs || 0}`);
      console.log(`  ⏱️ PDF Conversion Time: ${result.extractionMetadata?.pdf_conversion_time || 0}ms`);
      console.log(`  🏆 Quality Grade: ${result.evaluationResults?.overallQuality?.grade || 'N/A'}`);
      console.log(`  📈 Overall Score: ${(result.evaluationResults?.overallQuality?.score * 100 || 0).toFixed(1)}%`);
      
      if (result.evaluationResults?.overallQuality?.passThreshold) {
        console.log('  🎯 Quality: ✅ PASS (≥70%)');
      } else {
        console.log('  🎯 Quality: ❌ FAIL (<70%)');
      }
      
      // Show Excel export information if available
      if (result.summary?.excelExport) {
        console.log('');
        console.log('📊 Excel Export:');
        console.log(`  📄 File: ${result.summary.excelExport.filePath}`);
        console.log(`  📋 Sheets: ${result.summary.excelExport.sheetsCreated.join(', ')}`);
        console.log(`  📊 KCs Exported: ${result.summary.excelExport.totalKCs}`);
      }
      
    } else if (workflowName === 'phase3') {
      console.log('📊 Phase 3 Results:');
      console.log(`  📚 Total KCs: ${result.summary?.totalKCs || 0}`);
      console.log(`  ✅ Valid KCs: ${result.summary?.validKCs || 0}`);
      console.log(`  🏆 Quality Grade: ${result.evaluationResults?.overallQuality?.grade || 'N/A'}`);
      console.log(`  📈 Overall Score: ${(result.evaluationResults?.overallQuality?.score * 100 || 0).toFixed(1)}%`);
      
      if (result.evaluationResults?.overallQuality?.passThreshold) {
        console.log('  🎯 Quality: ✅ PASS (≥70%)');
      } else {
        console.log('  🎯 Quality: ❌ FAIL (<70%)');
      }
    }
    
    // Show evaluation breakdown if available
    if (result.evaluationResults) {
      console.log('');
      console.log('📋 Evaluation Breakdown:');
      console.log(`  🎯 Faithfulness: ${(result.evaluationResults.faithfulness?.score * 100 || 0).toFixed(1)}%`);
      console.log(`  🚫 Hallucination: ${(result.evaluationResults.hallucination?.score * 100 || 0).toFixed(1)}% (lower is better)`);
      console.log(`  📝 Completeness: ${(result.evaluationResults.completeness?.score * 100 || 0).toFixed(1)}%`);
      console.log(`  🎪 Relevancy: ${(result.evaluationResults.answerRelevancy?.score * 100 || 0).toFixed(1)}%`);
    }
    
    // Show agent contributions if available
    if (result.extractionMetadata?.agent_contributions) {
      console.log('');
      console.log('🤖 Agent Contributions:');
      const contributions = result.extractionMetadata.agent_contributions;
      console.log(`  ⚛️  Atomicity: ${contributions.atomicity || 0} KCs`);
      console.log(`  🔗 Anchors: ${contributions.anchors || 0} KCs`);
      console.log(`  📝 Assessment: ${contributions.assessment || 0} KCs`);
      console.log(`  🌸 Bloom: ${contributions.bloom || 0} KCs`);
    }

    if (result.written && result.written.length > 0) {
      console.log('');
      console.log('📁 Written files:');
      for (const p of result.written) console.log(`  - ${p}`);
    }
    
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('');
    console.error('❌ Workflow failed:', (err as Error).message);
    console.error('');
    
    if (workflowName === 'full-circle' && (err as Error).message.includes('Datalab')) {
      console.error('💡 Tip: Make sure you have a valid Datalab API key and the Python SDK installed.');
      console.error('   Get API key from: https://documentation.datalab.to/');
      console.error('   Install Python SDK: pip install datalab-python-sdk');
    }
    
    process.exit(1);
  }
}

main();


