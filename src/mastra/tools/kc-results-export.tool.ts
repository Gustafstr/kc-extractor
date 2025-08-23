import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { KC } from '../schemas/kc';

/**
 * Tool for exporting KC extraction results to Excel format (without evaluation data)
 * Creates a workbook with Instructions, KC Assessment, and Coverage sheets
 */
export const kcResultsExportTool = createTool({
  id: 'kc-results-export',
  description: 'Export KC extraction results to Excel format for expert review (without evaluation metrics)',
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
    courseTitle: z.string().describe('Course title'),
    outputPath: z.string().describe('Output file path for the Excel file'),
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
      courseTitle, 
      outputPath 
    } = context;

    const ExcelJS = (await import('exceljs')).default;
    const fs = await import('fs');
    const path = await import('path');

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📊 Creating KC Results Excel with ${finalKCs.length} KCs...`);

    // Sheet 1: Instructions
    const instructionsSheet = workbook.addWorksheet('Instructions');
    createInstructionsSheet(instructionsSheet);

    // Sheet 2: KC Assessment
    const kcAssessmentSheet = workbook.addWorksheet('KC Assessment');
    createKCAssessmentSheet(kcAssessmentSheet, finalKCs);

    // Sheet 3: Coverage
    const coverageSheet = workbook.addWorksheet('Coverage');
    createCoverageSheet(coverageSheet);

    // Sheet 4: Metadata (simplified without evaluation results)
    const metadataSheet = workbook.addWorksheet('Extraction-Metadata');
    createMetadataSheet(metadataSheet, courseMetadata, extractionMetadata, courseTitle, finalKCs.length);

    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);

    const sheetsCreated = ['Instructions', 'KC Assessment', 'Coverage', 'Extraction-Metadata'];

    console.log(`✅ KC Results Excel saved: ${outputPath}`);
    console.log(`📋 Sheets created: ${sheetsCreated.join(', ')}`);

    return {
      filePath: outputPath,
      sheetsCreated,
      totalKCs: finalKCs.length,
    };
  },
});

// Helper functions (copied from original excel-export.tool.ts)
function createInstructionsSheet(sheet: any) {
  // Set column widths
  sheet.getColumn('A').width = 80;
  
  let row = 1;
  
  // Title
  const titleCell = sheet.getCell(`A${row}`);
  titleCell.value = 'Instructions for Expert Review of Knowledge Components (KCs)';
  titleCell.font = { bold: true, size: 16 };
  row += 2;
  
  // Introduction
  sheet.getCell(`A${row++}`).value = 'Go through each KC in the sheet \'KC Assessment\'.';
  sheet.getCell(`A${row++}`).value = 'Evaluate each KC according to the following criteria:';
  row++;
  
  // Criteria sections
  const criteria = [
    {
      name: 'Accuracy (1–5)',
      definition: 'Does the KC correctly represent a concept, skill, or fact from the course material? Is it factually correct within the subject?',
      good: 'Understand how supply and demand curves determine equilibrium price.',
      bad: 'Understand how supply and demand curves predict inflation. (inaccurate or misleading)'
    },
    {
      name: 'Granularity (1–5)',
      definition: 'Is the KC at an appropriate level of detail? Not too broad (covering multiple concepts) or too narrow (trivial details).',
      good: 'Calculate the break-even point for a business.',
      bad: 'Understand business. (too broad) OR Know that profit = revenue - costs. (too narrow)'
    },
    {
      name: 'Clarity (1–5)',
      definition: 'Is the KC clearly and unambiguously stated? Can a student understand what they need to learn?',
      good: 'Explain the difference between fixed and variable costs.',
      bad: 'Understand cost things and stuff. (unclear and vague)'
    },
    {
      name: 'Redundancy (Y/N)',
      definition: 'Does this KC duplicate or significantly overlap with another KC in the list?',
      good: 'Each KC covers a distinct concept or skill.',
      bad: 'Multiple KCs that essentially teach the same thing with slight wording differences.'
    },
    {
      name: 'Acceptability (1 = Acceptable, 2 = Marginal, 3 = Unacceptable)',
      definition: 'Overall judgment: Is this KC suitable for inclusion in the final list?',
      good: 'Clear, accurate, appropriately scoped KC that adds value.',
      bad: 'Confusing, inaccurate, or redundant KC that should be removed or revised.'
    },
    {
      name: 'Coverage',
      definition: 'Do the KCs as a set adequately cover the important concepts and skills from the course?',
      good: 'The KC list comprehensively covers key learning objectives.',
      bad: 'Important topics are missing or underrepresented in the KC list.'
    }
  ];
  
  for (const criterion of criteria) {
    // Criterion name
    const nameCell = sheet.getCell(`A${row}`);
    nameCell.value = criterion.name;
    nameCell.font = { bold: true, size: 12 };
    row++;
    
    // Definition
    sheet.getCell(`A${row++}`).value = `Definition: ${criterion.definition}`;
    row++;
    
    // Good example
    const goodCell = sheet.getCell(`A${row}`);
    goodCell.value = `Good: "${criterion.good}"`;
    goodCell.font = { color: { argb: '00008000' } }; // Green
    row++;
    
    // Bad example
    const badCell = sheet.getCell(`A${row}`);
    badCell.value = `Bad: "${criterion.bad}"`;
    badCell.font = { color: { argb: 'FFFF0000' } }; // Red
    row += 2;
  }
}

function createKCAssessmentSheet(sheet: any, finalKCs: KC[]) {
  // Set column widths
  sheet.getColumn('A').width = 10;  // KC-ID
  sheet.getColumn('B').width = 40;  // KC Label
  sheet.getColumn('C').width = 50;  // KC Definition
  sheet.getColumn('D').width = 40;  // Example Assessment
  sheet.getColumn('E').width = 15;  // Bloom classification
  sheet.getColumn('F').width = 12;  // Accuracy
  sheet.getColumn('G').width = 12;  // Granularity
  sheet.getColumn('H').width = 12;  // Clarity
  sheet.getColumn('I').width = 12;  // Redundancy
  sheet.getColumn('J').width = 15;  // Acceptability
  sheet.getColumn('K').width = 30;  // Comment
  
  // Headers
  const headers = [
    'KC-ID', 'KC (Label)', 'KC (Definition)', 'Example Assessment', 'Bloom classification',
    'Accuracy (1–5)', 'Granularity (1–5)', 'Clarity (1–5)', 'Redundancy (Y/N)', 
    'Acceptability (1 = Acceptable, 2 = Marginal, 3 = Unacceptable)', 'Comment (optional)'
  ];
  
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
  });
  
  // Add KC data
  finalKCs.forEach((kc, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = kc.kc_id || `KC-${String(index + 1).padStart(3, '0')}`;
    sheet.getCell(row, 2).value = kc.label;
    sheet.getCell(row, 3).value = kc.definition;
    sheet.getCell(row, 4).value = kc.example_assessment || 'Example exam question';
    sheet.getCell(row, 5).value = kc.bloom;
    
    // Empty cells for reviewer scoring (F through K)
    for (let col = 6; col <= 11; col++) {
      sheet.getCell(row, col).value = '';
    }
  });
  
  // Add data validation for scoring columns
  const totalRows = finalKCs.length + 1;
  
  // Accuracy, Granularity, Clarity (1-5)
  for (let col of [6, 7, 8]) {
    sheet.dataValidations.add(`${String.fromCharCode(64 + col)}2:${String.fromCharCode(64 + col)}${totalRows}`, {
      type: 'list',
      allowBlank: true,
      formulae: ['"1,2,3,4,5"']
    });
  }
  
  // Redundancy (Y/N)
  sheet.dataValidations.add(`I2:I${totalRows}`, {
    type: 'list',
    allowBlank: true,
    formulae: ['"Y,N"']
  });
  
  // Acceptability (1-3)
  sheet.dataValidations.add(`J2:J${totalRows}`, {
    type: 'list',
    allowBlank: true,
    formulae: ['"1,2,3"']
  });
}

function createCoverageSheet(sheet: any) {
  // Set column widths
  sheet.getColumn('A').width = 80;
  sheet.getColumn('B').width = 30;
  
  // Headers
  sheet.getCell('A1').value = 'Question';
  sheet.getCell('B1').value = 'Answer';
  
  // Style headers
  ['A1', 'B1'].forEach(cell => {
    const cellObj = sheet.getCell(cell);
    cellObj.font = { bold: true };
    cellObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
  });
  
  // Questions
  const questions = [
    'Does the KCs cover all the important areas of the course? (1–5 score where 1 = Not at all, and 5 = Covers everything)',
    'Are any important area(s) missing, if so how many? (set the count)',
    'Additional comment (optional)'
  ];
  
  questions.forEach((question, index) => {
    sheet.getCell(index + 2, 1).value = question;
    sheet.getCell(index + 2, 2).value = ''; // Empty for expert to fill
  });
}

function createMetadataSheet(sheet: any, courseMetadata: any, extractionMetadata: any, courseTitle: string, totalKCs: number) {
  // Set column widths
  sheet.getColumn('A').width = 30;
  sheet.getColumn('B').width = 50;
  
  // Headers
  sheet.getCell('A1').value = 'Field';
  sheet.getCell('B1').value = 'Value';
  
  // Style headers
  ['A1', 'B1'].forEach(cell => {
    const cellObj = sheet.getCell(cell);
    cellObj.font = { bold: true };
    cellObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
  });
  
  // Metadata rows
  const metadata = [
    ['Total KCs', totalKCs],
    ['Total amount of documents', courseMetadata.totalFiles],
    ['Course Name', courseTitle],
    ['Model Used', extractionMetadata.model_used],
    ['Extraction Phase', extractionMetadata.phase],
    ['Parallel Agents', extractionMetadata.parallel_agents],
    ['Agent Contributions - Atomicity', extractionMetadata.agent_contributions.atomicity],
    ['Agent Contributions - Anchors', extractionMetadata.agent_contributions.anchors],
    ['Agent Contributions - Assessment', extractionMetadata.agent_contributions.assessment],
    ['Agent Contributions - Bloom', extractionMetadata.agent_contributions.bloom],
    ['PDF Conversion Time (ms)', extractionMetadata.pdf_conversion_time || 'N/A'],
    ['Total Anchors Found', courseMetadata.totalAnchors],
    ['Converted PDFs', courseMetadata.convertedPdfs || 'N/A'],
  ];
  
  metadata.forEach(([field, value], index) => {
    sheet.getCell(index + 2, 1).value = field;
    sheet.getCell(index + 2, 2).value = value;
  });
}
