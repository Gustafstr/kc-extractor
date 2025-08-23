import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool for exporting evaluation results to Excel format
 * Creates a workbook focused on quality metrics and evaluation results
 */
export const evaluationReportExportTool = createTool({
  id: 'evaluation-report-export',
  description: 'Export evaluation results and quality metrics to Excel format',
  inputSchema: z.object({
    finalKCs: z.array(z.any()).describe('Final Knowledge Components from extraction'),
    courseMetadata: z.object({
      title: z.string().optional(),
      totalFiles: z.number(),
      totalAnchors: z.number(),
      convertedPdfs: z.number().optional(),
    }),
    extractionMetadata: z.object({
      model_used: z.string(),
      phase: z.string(),
      parallel_agents: z.number(),
      total_processing_time: z.number(),
      pdf_conversion_time: z.number().optional(),
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
    courseTitle: z.string().describe('Course title'),
    outputPath: z.string().describe('Output file path for the Excel file'),
  }),
  outputSchema: z.object({
    filePath: z.string().describe('Path to the created Excel file'),
    sheetsCreated: z.array(z.string()).describe('List of sheets created in the workbook'),
    overallGrade: z.string().describe('Overall quality grade'),
    overallScore: z.number().describe('Overall quality score'),
  }),
  execute: async ({ context }) => {
    const { 
      finalKCs, 
      courseMetadata, 
      extractionMetadata, 
      evaluationResults,
      courseTitle, 
      outputPath 
    } = context;

    const ExcelJS = await import('exceljs');
    const fs = await import('fs');
    const path = await import('path');

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📊 Creating Evaluation Report Excel...`);

    // Sheet 1: Quality Summary
    const summarySheet = workbook.addWorksheet('Quality Summary');
    createQualitySummarySheet(summarySheet, evaluationResults, courseMetadata, extractionMetadata, courseTitle, finalKCs.length);

    // Sheet 2: Detailed Metrics
    const metricsSheet = workbook.addWorksheet('Detailed Metrics');
    createDetailedMetricsSheet(metricsSheet, evaluationResults);

    // Sheet 3: Recommendations
    const recommendationsSheet = workbook.addWorksheet('Recommendations');
    createRecommendationsSheet(recommendationsSheet, evaluationResults);

    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);

    const sheetsCreated = ['Quality Summary', 'Detailed Metrics', 'Recommendations'];

    console.log(`✅ Evaluation Report Excel saved: ${outputPath}`);
    console.log(`🎯 Overall Grade: ${evaluationResults.overallQuality.grade} (${evaluationResults.overallQuality.score.toFixed(3)})`);

    return {
      filePath: outputPath,
      sheetsCreated,
      overallGrade: evaluationResults.overallQuality.grade,
      overallScore: evaluationResults.overallQuality.score,
    };
  },
});

function createQualitySummarySheet(sheet: any, evaluationResults: any, courseMetadata: any, extractionMetadata: any, courseTitle: string, totalKCs: number) {
  // Set column widths
  sheet.getColumn('A').width = 30;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 50;
  
  // Title
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'KC Extraction Quality Report';
  titleCell.font = { bold: true, size: 16 };
  sheet.mergeCells('A1:C1');
  
  let row = 3;
  
  // Course Information
  const courseInfoCell = sheet.getCell(`A${row}`);
  courseInfoCell.value = 'Course Information';
  courseInfoCell.font = { bold: true, size: 14 };
  sheet.mergeCells(`A${row}:C${row}`);
  row++;
  
  const courseInfo = [
    ['Course Name', courseTitle, ''],
    ['Total Documents', courseMetadata.totalFiles, ''],
    ['Total KCs Generated', totalKCs, ''],
    ['Model Used', extractionMetadata.model_used, ''],
    ['Processing Time', `${extractionMetadata.total_processing_time || 'N/A'}ms`, ''],
  ];
  
  courseInfo.forEach(([field, value, note]) => {
    sheet.getCell(`A${row}`).value = field;
    sheet.getCell(`B${row}`).value = value;
    sheet.getCell(`C${row}`).value = note;
    row++;
  });
  
  row += 2;
  
  // Quality Metrics
  const qualityCell = sheet.getCell(`A${row}`);
  qualityCell.value = 'Quality Metrics';
  qualityCell.font = { bold: true, size: 14 };
  sheet.mergeCells(`A${row}:C${row}`);
  row++;
  
  // Headers for metrics
  sheet.getCell(`A${row}`).value = 'Metric';
  sheet.getCell(`B${row}`).value = 'Score';
  sheet.getCell(`C${row}`).value = 'Interpretation';
  
  ['A', 'B', 'C'].forEach(col => {
    const cell = sheet.getCell(`${col}${row}`);
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
  });
  row++;
  
  // Metrics data
  const metrics = [
    ['Faithfulness', evaluationResults.faithfulness.score.toFixed(3), 'How accurately KCs represent course content'],
    ['Hallucination', evaluationResults.hallucination.score.toFixed(3), 'Presence of fabricated information (lower is better)'],
    ['Completeness', evaluationResults.completeness.score.toFixed(3), 'Coverage of key course concepts'],
    ['Answer Relevancy', evaluationResults.answerRelevancy.score.toFixed(3), 'Relevance to learning objectives'],
  ];
  
  metrics.forEach(([metric, score, interpretation]) => {
    sheet.getCell(`A${row}`).value = metric;
    sheet.getCell(`B${row}`).value = score;
    sheet.getCell(`C${row}`).value = interpretation;
    row++;
  });
  
  row += 2;
  
  // Overall Quality
  const overallCell = sheet.getCell(`A${row}`);
  overallCell.value = 'Overall Quality Assessment';
  overallCell.font = { bold: true, size: 14 };
  sheet.mergeCells(`A${row}:C${row}`);
  row++;
  
  const gradeCell = sheet.getCell(`A${row}`);
  gradeCell.value = 'Grade';
  const gradeValueCell = sheet.getCell(`B${row}`);
  gradeValueCell.value = evaluationResults.overallQuality.grade;
  gradeValueCell.font = { bold: true, size: 16 };
  
  // Color code the grade
  const gradeColor = {
    'A': '00008000', // Green
    'B': '0000FF00', // Yellow
    'C': 'FFFF8000', // Orange
    'D': 'FFFF0000', // Red
    'F': 'FF800080'  // Purple
  }[evaluationResults.overallQuality.grade as 'A' | 'B' | 'C' | 'D' | 'F'] || '00000000';
  
  gradeValueCell.font = { ...gradeValueCell.font, color: { argb: gradeColor } };
  row++;
  
  sheet.getCell(`A${row}`).value = 'Score';
  sheet.getCell(`B${row}`).value = evaluationResults.overallQuality.score.toFixed(3);
  row++;
  
  sheet.getCell(`A${row}`).value = 'Pass Threshold (70%)';
  const passCell = sheet.getCell(`B${row}`);
  passCell.value = evaluationResults.overallQuality.passThreshold ? 'PASS' : 'FAIL';
  passCell.font = { 
    bold: true, 
    color: { argb: evaluationResults.overallQuality.passThreshold ? '00008000' : 'FFFF0000' }
  };
}

function createDetailedMetricsSheet(sheet: any, evaluationResults: any) {
  // Set column widths
  sheet.getColumn('A').width = 20;
  sheet.getColumn('B').width = 15;
  sheet.getColumn('C').width = 60;
  
  // Headers
  sheet.getCell('A1').value = 'Metric';
  sheet.getCell('B1').value = 'Score';
  sheet.getCell('C1').value = 'Detailed Reasoning';
  
  // Style headers
  ['A1', 'B1', 'C1'].forEach(cell => {
    const cellObj = sheet.getCell(cell);
    cellObj.font = { bold: true };
    cellObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
  });
  
  // Detailed metrics
  const detailedMetrics = [
    ['Faithfulness', evaluationResults.faithfulness.score.toFixed(3), evaluationResults.faithfulness.reason],
    ['Hallucination', evaluationResults.hallucination.score.toFixed(3), evaluationResults.hallucination.reason],
    ['Completeness', evaluationResults.completeness.score.toFixed(3), JSON.stringify(evaluationResults.completeness.info, null, 2)],
    ['Answer Relevancy', evaluationResults.answerRelevancy.score.toFixed(3), evaluationResults.answerRelevancy.reason],
  ];
  
  detailedMetrics.forEach(([metric, score, reasoning], index) => {
    const row = index + 2;
    sheet.getCell(`A${row}`).value = metric;
    sheet.getCell(`B${row}`).value = score;
    sheet.getCell(`C${row}`).value = reasoning;
    
    // Wrap text for reasoning column
    sheet.getCell(`C${row}`).alignment = { wrapText: true, vertical: 'top' };
  });
}

function createRecommendationsSheet(sheet: any, evaluationResults: any) {
  // Set column widths
  sheet.getColumn('A').width = 80;
  
  let row = 1;
  
  // Title
  const titleCell = sheet.getCell(`A${row}`);
  titleCell.value = 'Recommendations for Improvement';
  titleCell.font = { bold: true, size: 16 };
  row += 2;
  
  // Generate recommendations based on scores
  const recommendations = [];
  
  if (evaluationResults.faithfulness.score < 0.7) {
    recommendations.push('🔍 Faithfulness Score Low: Review KCs for accuracy against source material. Consider refining extraction prompts to better capture factual content.');
  }
  
  if (evaluationResults.hallucination.score > 0.3) {
    recommendations.push('⚠️ Hallucination Score High: KCs may contain fabricated information. Review extraction process and consider adding more explicit grounding to source material.');
  }
  
  if (evaluationResults.completeness.score < 0.7) {
    recommendations.push('📚 Completeness Score Low: Important course concepts may be missing. Consider expanding the extraction scope or reviewing course materials for coverage gaps.');
  }
  
  if (evaluationResults.answerRelevancy.score < 0.7) {
    recommendations.push('🎯 Relevancy Score Low: KCs may not align well with learning objectives. Review course goals and refine KC extraction to focus on key learning outcomes.');
  }
  
  if (evaluationResults.overallQuality.score >= 0.8) {
    recommendations.push('✅ Excellent Quality: KCs meet high standards. Consider this extraction ready for expert review with minimal revisions needed.');
  } else if (evaluationResults.overallQuality.score >= 0.7) {
    recommendations.push('👍 Good Quality: KCs are acceptable but could benefit from targeted improvements in lower-scoring areas.');
  } else {
    recommendations.push('🔄 Needs Improvement: Consider re-running extraction with refined parameters or additional source material review.');
  }
  
  // Add general recommendations
  recommendations.push('');
  recommendations.push('General Recommendations:');
  recommendations.push('• Review KCs with subject matter experts');
  recommendations.push('• Validate against course learning objectives');
  recommendations.push('• Consider student assessment alignment');
  recommendations.push('• Test KC clarity with target audience');
  
  recommendations.forEach(recommendation => {
    sheet.getCell(`A${row}`).value = recommendation;
    sheet.getCell(`A${row}`).alignment = { wrapText: true };
    row++;
  });
}
