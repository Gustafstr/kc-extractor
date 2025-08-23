import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { KC } from '../schemas/kc';

/**
 * Tool for exporting KC extraction results to Excel format
 * Creates a comprehensive workbook with Instructions, KC Assessment, Coverage, and Evaluation-template sheets
 */
export const excelExportTool = createTool({
  id: 'excel-export',
  description: 'Export KC extraction results to Excel format with expert review structure',
  inputSchema: z.object({
    finalKCs: z.array(z.any()).describe('Final Knowledge Components from extraction'),
    courseMetadata: z.object({
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
    courseTitle: z.string(),
    outputPath: z.string().describe('Path where to save the Excel file'),
  }),
  outputSchema: z.object({
    filePath: z.string().describe('Path to the created Excel file'),
    sheetsCreated: z.array(z.string()).describe('List of sheets created in the workbook'),
    totalKCs: z.number().describe('Total number of KCs exported'),
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

    const ExcelJS = (await import('exceljs')).default;
    const fs = await import('fs');
    const path = await import('path');
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📊 Creating Excel export with ${finalKCs.length} KCs...`);

    // Sheet 1: Instructions
    const instructionsSheet = workbook.addWorksheet('Instructions');
    
    // Add instructions content
    const instructionsContent = [
      'Instructions for Expert Review of Knowledge Components (KCs):',
      '',
      'Go through each KC in the sheet \'KC Assessment\'.',
      'Evaluate each KC according to the following criteria:',
      '',
      '1. Accuracy (1–5)',
      'Definition: Does the KC correctly represent a concept, skill, or fact from the course material? Is it factually correct within the subject?',
      'Good: "Understand how supply and demand curves determine equilibrium price."',
      'Bad: "Understand how supply and demand curves predict inflation." (inaccurate or misleading)',
      '',
      '2. Granularity (1–5)',
      'Definition: Is the KC at an appropriate level of detail? Not too broad (covering multiple concepts) or too narrow (trivial details).',
      'Good: "Calculate the break-even point for a business."',
      'Bad: "Understand business." (too broad) or "Know that profit = revenue - costs." (too narrow)',
      '',
      '3. Clarity (1–5)',
      'Definition: Is the KC clearly and unambiguously stated? Can a student understand what they need to learn?',
      'Good: "Identify the main components of a business plan."',
      'Bad: "Understand business planning stuff." (vague and unclear)',
      '',
      '4. Redundancy (Y/N)',
      'Definition: Does this KC overlap significantly with another KC in the list? Are there duplicates or near-duplicates?',
      'Good: Each KC represents a unique learning objective.',
      'Bad: "Calculate ROI" and "Compute return on investment" (redundant)',
      '',
      '5. Acceptability (1 = Acceptable, 2 = Marginal, 3 = Unacceptable)',
      'Definition: Overall judgment on whether this KC should be included in the final list.',
      '1 = Acceptable: Well-formed, useful KC that should be kept',
      '2 = Marginal: Has issues but might be salvageable with revision',
      '3 = Unacceptable: Should be removed or completely rewritten',
      '',
      '6. Coverage',
      'Definition: Do the KCs as a whole adequately cover the important concepts in the course?',
      'Consider: Are there major topics missing? Are some areas over-represented?',
      '',
      'Scoring Guidelines:',
      '5 = Excellent: Meets all criteria perfectly',
      '4 = Good: Meets criteria well with minor issues',
      '3 = Satisfactory: Adequate but has noticeable issues',
      '2 = Poor: Significant problems that need addressing',
      '1 = Very Poor: Major problems, likely needs complete revision',
    ];

    instructionsContent.forEach((line, index) => {
      const row = instructionsSheet.getRow(index + 1);
      row.getCell(1).value = line;
      
      // Style headers
      if (line.includes('Accuracy') || line.includes('Granularity') || 
          line.includes('Clarity') || line.includes('Redundancy') || 
          line.includes('Acceptability') || line.includes('Coverage') ||
          line.includes('Scoring Guidelines:')) {
        row.getCell(1).font = { bold: true, size: 12 };
      } else if (line.includes('Instructions for Expert Review')) {
        row.getCell(1).font = { bold: true, size: 14 };
      }
    });

    // Auto-fit column width
    instructionsSheet.getColumn(1).width = 120;
    instructionsSheet.getColumn(1).alignment = { wrapText: true };

    // Sheet 2: KC Assessment
    const kcSheet = workbook.addWorksheet('KC Assessment');
    
    // Add headers
    const headers = [
      'KC-ID',
      'KC (Label)',
      'KC (Definition)',
      'Example Assessment',
      'Bloom Classification',
      'Accuracy (1–5)',
      'Granularity (1–5)',
      'Clarity (1–5)',
      'Redundancy (Y/N)',
      'Acceptability (1 = Acceptable, 2 = Marginal, 3 = Unacceptable)',
      'Comment (optional)'
    ];

    const headerRow = kcSheet.getRow(1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add KC data
    finalKCs.forEach((kc: any, index) => {
      const row = kcSheet.getRow(index + 2);
      
      row.getCell(1).value = kc.kc_id || `KC-${String(index + 1).padStart(3, '0')}`;
      row.getCell(2).value = kc.label || '';
      row.getCell(3).value = kc.definition || '';
      row.getCell(4).value = kc.example_assessment || '';
      row.getCell(5).value = kc.bloom || '';
      
      // Leave evaluation columns empty for expert review
      // Cells 6-11 will be filled by experts
      
      // Add borders to all cells
      for (let col = 1; col <= 11; col++) {
        row.getCell(col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Set column widths
    kcSheet.getColumn(1).width = 12; // KC-ID
    kcSheet.getColumn(2).width = 40; // Label
    kcSheet.getColumn(3).width = 60; // Definition
    kcSheet.getColumn(4).width = 40; // Example Assessment
    kcSheet.getColumn(5).width = 15; // Bloom
    kcSheet.getColumn(6).width = 12; // Accuracy
    kcSheet.getColumn(7).width = 12; // Granularity
    kcSheet.getColumn(8).width = 12; // Clarity
    kcSheet.getColumn(9).width = 15; // Redundancy
    kcSheet.getColumn(10).width = 25; // Acceptability
    kcSheet.getColumn(11).width = 40; // Comment

    // Add data validation for scoring columns
    for (let row = 2; row <= finalKCs.length + 1; row++) {
      // Accuracy, Granularity, Clarity (1-5)
      [6, 7, 8].forEach(col => {
        kcSheet.getCell(row, col).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"1,2,3,4,5"']
        };
      });
      
      // Redundancy (Y/N)
      kcSheet.getCell(row, 9).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Y,N"']
      };
      
      // Acceptability (1-3)
      kcSheet.getCell(row, 10).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"1,2,3"']
      };
    }

    // Sheet 3: Coverage
    const coverageSheet = workbook.addWorksheet('Coverage');
    
    // Add coverage headers
    const coverageHeaders = ['Question', 'Answer'];
    const coverageHeaderRow = coverageSheet.getRow(1);
    coverageHeaders.forEach((header, index) => {
      const cell = coverageHeaderRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add coverage questions
    const coverageQuestions = [
      'Does the KCs cover all the important areas of the course? (1–5 score where 1 = Not at all, and 5 = Covers everything)',
      'Are any important area(s) missing, if so how many? (set the count)',
      'Additional comment (optional)'
    ];

    coverageQuestions.forEach((question, index) => {
      const row = coverageSheet.getRow(index + 2);
      row.getCell(1).value = question;
      row.getCell(1).alignment = { wrapText: true };
      
      // Add borders
      for (let col = 1; col <= 2; col++) {
        row.getCell(col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Set column widths for coverage
    coverageSheet.getColumn(1).width = 80;
    coverageSheet.getColumn(2).width = 30;

    // Add data validation for first question (1-5 scale)
    coverageSheet.getCell(2, 2).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"1,2,3,4,5"']
    };

    // Sheet 4: Evaluation-template
    const evalSheet = workbook.addWorksheet('Evaluation-template');
    
    // Add evaluation template data
    const evalData = [
      ['Field', 'Value'],
      ['Total KCs', finalKCs.length],
      ['Total amount of documents', courseMetadata.totalFiles],
      ['Course Name', courseTitle],
      ['Quality Grade', evaluationResults.overallQuality.grade],
      ['Overall Score', `${(evaluationResults.overallQuality.score * 100).toFixed(1)}%`],
      ['Quality:', evaluationResults.overallQuality.passThreshold ? 'PASS' : 'FAIL'],
      ['Faithfulness:', `${(evaluationResults.faithfulness.score * 100).toFixed(1)}%`],
      ['Hallucination:', `${(evaluationResults.hallucination.score * 100).toFixed(1)}%`],
      ['Completeness:', `${(evaluationResults.completeness.score * 100).toFixed(1)}%`],
      ['Relevancy:', `${(evaluationResults.answerRelevancy.score * 100).toFixed(1)}%`],
      ['Model Used:', extractionMetadata.model_used],
      ['Phase:', extractionMetadata.phase],
      ['Parallel Agents:', extractionMetadata.parallel_agents],
      ['Processing Time:', `${extractionMetadata.total_processing_time}ms`],
      ['PDF Conversion Time:', `${extractionMetadata.pdf_conversion_time || 0}ms`],
      ['Agent Contributions:', ''],
      ['  - Atomicity:', extractionMetadata.agent_contributions.atomicity],
      ['  - Anchors:', extractionMetadata.agent_contributions.anchors],
      ['  - Assessment:', extractionMetadata.agent_contributions.assessment],
      ['  - Bloom:', extractionMetadata.agent_contributions.bloom],
    ];

    evalData.forEach((rowData, index) => {
      const row = evalSheet.getRow(index + 1);
      row.getCell(1).value = rowData[0];
      row.getCell(2).value = rowData[1];
      
      // Style header row
      if (index === 0) {
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true };
        row.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        };
        row.getCell(2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        };
      }
      
      // Style section headers
      if (rowData[0].includes(':') && !rowData[0].includes('  -')) {
        row.getCell(1).font = { bold: true };
      }
      
      // Add borders
      for (let col = 1; col <= 2; col++) {
        row.getCell(col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Set column widths for evaluation template
    evalSheet.getColumn(1).width = 25;
    evalSheet.getColumn(2).width = 30;

    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);
    
    const sheetsCreated = ['Instructions', 'KC Assessment', 'Coverage', 'Evaluation-template'];
    
    console.log(`✅ Excel file created: ${outputPath}`);
    console.log(`📊 Sheets created: ${sheetsCreated.join(', ')}`);
    console.log(`📋 Total KCs exported: ${finalKCs.length}`);

    return {
      filePath: outputPath,
      sheetsCreated,
      totalKCs: finalKCs.length,
    };
  },
});
