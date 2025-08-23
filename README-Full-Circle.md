# KC-Extraction-Full-Circle Workflow

The **KC-Extraction-Full-Circle** workflow is a comprehensive solution that converts PDF documents to Knowledge Components (KCs) using the complete pipeline from document processing to quality evaluation.

## Overview

This workflow implements a complete "full circle" approach:

1. **PDF Conversion**: Uses [Datalab API](https://documentation.datalab.to/) to convert PDF files to structured Markdown
2. **Multi-Agent KC Extraction**: Employs 4 specialized AI agents running in parallel
3. **Master Consolidation**: Combines and deduplicates results from all agents
4. **Quality Evaluation**: Runs 4 evaluation metrics in parallel to assess KC quality
5. **Comprehensive Results**: Returns detailed metrics, scores, and quality grades

## Features

- 🔄 **Full Circle Processing**: PDF → Markdown → Knowledge Components
- 🤖 **Multi-Agent Architecture**: 4 specialized agents (Atomicity, Anchors, Assessment, Bloom)
- 📊 **Quality Evaluation**: Faithfulness, Hallucination, Completeness, Answer Relevancy metrics
- ⚡ **Parallel Processing**: Agents and evaluations run concurrently for speed
- 🎯 **Quality Grading**: A-F grades with 70% pass threshold
- 📈 **Detailed Analytics**: Agent contributions, conversion times, and comprehensive metrics

## Prerequisites

### 1. Datalab API Key

Get your API key from [Datalab](https://documentation.datalab.to/):

```bash
export DATALAB_API_KEY="your-datalab-api-key"
```

### 2. Google Gemini API Key

Set up your Gemini API key [[memory:7008438]]:

```bash
export GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
```

### 3. Install Dependencies

```bash
npm install
```

## Usage

### Basic Usage

```bash
npm run kc full-circle
```

### Custom Directories

```bash
npm run kc full-circle [pdfDir] [markdownDir] [outputDir] [model] [courseTitle] [datalabApiKey]
```

### Examples

**Default settings:**

```bash
npm run kc full-circle
```

- PDF Directory: `src/mastra/Input/PDFs`
- Markdown Directory: `src/mastra/Input/Converted`
- Output Directory: `out`
- Model: `google:gemini-2.5-pro`
- Course Title: `Course Knowledge Components`

**Custom directories:**

```bash
npm run kc full-circle ./my-pdfs ./converted-md ./output google:gemini-2.5-pro "Advanced Physics Course"
```

**With API key as argument:**

```bash
npm run kc full-circle ./pdfs ./md ./out google:gemini-2.5-pro "My Course" "your-datalab-key"
```

## Workflow Steps

### Step 0: PDF Conversion

- Scans the PDF directory for `.pdf` files
- Converts each PDF to Markdown using Datalab's Marker API
- Saves converted files to the markdown directory
- Tracks conversion metrics and timing

### Step 1: Course Loading

- Loads all converted Markdown files
- Extracts anchor points and metadata
- Combines content for agent processing

### Step 2: Multi-Agent Extraction (Parallel)

Four specialized agents run simultaneously:

1. **Atomicity Agent**: Extracts atomic, single-concept KCs
2. **Anchors Agent**: Finds evidence-based KCs with strong anchor support
3. **Assessment Agent**: Identifies testable KCs with assessment examples
4. **Bloom Agent**: Classifies KCs using Bloom's taxonomy

### Step 3: Master Consolidation

- Combines outputs from all 4 agents
- Removes duplicates and conflicts
- Produces final consolidated KC set

### Step 4: Quality Evaluation (Parallel)

Four evaluation metrics run simultaneously:

1. **Faithfulness**: How accurately KCs represent course content
2. **Hallucination**: Detects fabricated information not in source
3. **Completeness**: How thoroughly KCs cover key concepts
4. **Answer Relevancy**: How well KCs address learning objectives

### Step 5: Results Generation

- Calculates overall quality score (average of 4 metrics)
- Assigns letter grade (A-F) based on performance
- Determines pass/fail status (70% threshold)
- Provides comprehensive analytics

## Output Format

The workflow returns a comprehensive result object:

```typescript
{
  summary: {
    totalKCs: number,
    validKCs: number,
    pdfConversions: number,
    outputFiles: string[]
  },
  finalKCs: KnowledgeComponent[],
  courseMetadata: {
    title: string,
    totalFiles: number,
    totalAnchors: number,
    convertedPdfs: number
  },
  extractionMetadata: {
    model_used: string,
    phase: string,
    parallel_agents: number,
    total_processing_time: number,
    pdf_conversion_time: number,
    agent_contributions: {
      atomicity: number,
      anchors: number,
      assessment: number,
      bloom: number
    }
  },
  evaluationResults: {
    faithfulness: { score: number, reason: string },
    hallucination: { score: number, reason: string },
    completeness: { score: number, info: any },
    answerRelevancy: { score: number, reason: string },
    overallQuality: {
      score: number,
      grade: 'A' | 'B' | 'C' | 'D' | 'F',
      passThreshold: boolean
    }
  }
}
```

## Example Output

```
🚀 Running full-circle workflow...
📄 PDF Directory: src/mastra/Input/PDFs
📝 Markdown Directory: src/mastra/Input/Converted
📁 Output Directory: out
🤖 Model: google:gemini-2.5-pro
📚 Course Title: Advanced Physics Course
🔑 Datalab API: Configured

⏳ Starting workflow execution...

🎉 Workflow completed successfully!

📊 Full Circle Results:
  📄 PDFs Converted: 5
  📚 Total KCs: 127
  ✅ Valid KCs: 119
  ⏱️ PDF Conversion Time: 15420ms
  🏆 Quality Grade: B
  📈 Overall Score: 82.3%
  🎯 Quality: ✅ PASS (≥70%)

📋 Evaluation Breakdown:
  🎯 Faithfulness: 85.2%
  🚫 Hallucination: 12.1% (lower is better)
  📝 Completeness: 78.9%
  🎪 Relevancy: 88.7%

🤖 Agent Contributions:
  ⚛️  Atomicity: 32 KCs
  🔗 Anchors: 28 KCs
  📝 Assessment: 35 KCs
  🌸 Bloom: 31 KCs
```

## Directory Structure

```
src/mastra/Input/
├── PDFs/                    # Place your PDF files here
│   ├── lecture1.pdf
│   ├── textbook-ch1.pdf
│   └── ...
├── Converted/               # Auto-generated markdown files
│   ├── lecture1.md
│   ├── textbook-ch1.md
│   └── ...
└── ...
```

## Troubleshooting

### Common Issues

1. **Missing Datalab API Key**

   ```
   Error: Datalab API key is required for full-circle workflow.
   ```

   **Solution**: Set the `DATALAB_API_KEY` environment variable or pass it as an argument.

2. **No PDF Files Found**

   ```
   ⚠️ No PDF files found in the input directory
   ```

   **Solution**: Ensure PDF files are in the correct directory and have `.pdf` extension.

3. **PDF Conversion Failures**

   ```
   ❌ Failed to convert filename.pdf: Datalab API error (401): Unauthorized
   ```

   **Solution**: Verify your Datalab API key is valid and has sufficient credits.

4. **Gemini API Issues**
   ```
   Error: Google Generative AI API key not found
   ```
   **Solution**: Set the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable.

### Help Command

```bash
npm run kc --help
```

## Comparison with Other Workflows

| Feature                | Phase 3        | Full Circle      |
| ---------------------- | -------------- | ---------------- |
| Input Format           | Markdown files | PDF files        |
| PDF Conversion         | ❌             | ✅ (Datalab API) |
| Multi-Agent Processing | ✅             | ✅               |
| Quality Evaluation     | ✅             | ✅               |
| Conversion Metrics     | ❌             | ✅               |
| End-to-End Processing  | ❌             | ✅               |

## Technical Details

- **Framework**: Built with [Mastra](https://mastra.ai) [[memory:7008439]]
- **Model**: Uses Google Gemini exclusively [[memory:7008438]]
- **Document Processing**: [Datalab Marker API](https://documentation.datalab.to/)
- **Evaluation**: Mastra's built-in evaluation framework
- **Architecture**: Parallel processing with step-based workflow
- **Output Format**: Structured JSON with comprehensive metadata

## Next Steps

After running the full-circle workflow, you can:

1. **Analyze Results**: Review the quality scores and agent contributions
2. **Iterate on Content**: Improve source PDFs based on evaluation feedback
3. **Export KCs**: Use the extracted Knowledge Components in your learning system
4. **Quality Improvement**: Focus on areas with low evaluation scores

For more information about the KC extraction system, see the main documentation in `Docs-Main.md`.
