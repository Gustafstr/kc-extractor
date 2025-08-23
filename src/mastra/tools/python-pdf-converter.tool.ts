import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool for converting PDF files to Markdown using your existing Python script
 * This calls your working Python script as a subprocess for maximum reliability
 */
export const pythonPdfConverterTool = createTool({
  id: 'python-pdf-converter',
  description: 'Convert PDF files to Markdown format using Python Datalab SDK script',
  inputSchema: z.object({
    pdfFilePath: z.string().describe('Path to the PDF file to convert'),
    outputPath: z.string().optional().describe('Optional output path for the markdown file'),
    datalabApiKey: z.string().describe('Datalab API key for conversion'),
  }),
  outputSchema: z.object({
    markdownContent: z.string().describe('The converted markdown content'),
    outputFilePath: z.string().describe('Path where the markdown file was saved'),
    metadata: z.object({
      originalFileName: z.string(),
      fileSize: z.number(),
      conversionTime: z.number(),
      pageCount: z.number().optional(),
    }),
  }),
  execute: async ({ context }) => {
    const { pdfFilePath, outputPath, datalabApiKey } = context;

    const fs = await import('fs');
    const path = await import('path');
    const { spawn } = await import('child_process');
    
    // Check if PDF file exists
    if (!fs.existsSync(pdfFilePath)) {
      throw new Error(`PDF file not found: ${pdfFilePath}`);
    }

    const startTime = Date.now();
    const fileName = path.basename(pdfFilePath, '.pdf');
    const fileStats = fs.statSync(pdfFilePath);
    
    try {
      // Determine output file path
      const outputFilePath = outputPath || path.join(
        path.dirname(pdfFilePath),
        `${fileName}.md`
      );

      console.log(`Converting PDF to Markdown using Python Datalab SDK: ${fileName}`);
      
      // Create temporary directories
      const tempDir = path.join(path.dirname(pdfFilePath), 'temp_conversion');
      const tempInputDir = path.join(tempDir, 'input');
      const tempOutputDir = path.join(tempDir, 'output');
      
      // Ensure temp directories exist
      if (!fs.existsSync(tempInputDir)) {
        fs.mkdirSync(tempInputDir, { recursive: true });
      }
      if (!fs.existsSync(tempOutputDir)) {
        fs.mkdirSync(tempOutputDir, { recursive: true });
      }
      
      // Copy PDF to temp input directory
      const tempPdfPath = path.join(tempInputDir, path.basename(pdfFilePath));
      fs.copyFileSync(pdfFilePath, tempPdfPath);
      
      // Create a simplified Python script based on your working script
      const pythonScript = `
import os
import sys
import ssl
from pathlib import Path

# Set the API key
os.environ['DATALAB_API_KEY'] = '${datalabApiKey}'

# Handle SSL certificate issues on macOS
try:
    import certifi
    os.environ['SSL_CERT_FILE'] = certifi.where()
except ImportError:
    pass

# Disable SSL verification as a fallback (not recommended for production)
ssl._create_default_https_context = ssl._create_unverified_context

try:
    from datalab_sdk import DatalabClient
    from datalab_sdk.models import ConvertOptions
except ImportError as e:
    print("Error: Datalab SDK not installed. Install with: pip install datalab-python-sdk", file=sys.stderr)
    sys.exit(1)

def convert_single_file():
    try:
        # Initialize client
        client = DatalabClient()
        
        # Set up conversion options
        options = ConvertOptions(
            output_format="markdown",
            force_ocr=False,
            use_llm=False,
            paginate=False,
        )
        
        # Convert the file
        input_file = Path('${tempPdfPath}')
        result = client.convert(str(input_file), options=options)
        
        # Get markdown content
        markdown_text = None
        for attr in ("markdown", "md", "content", "text"):
            if hasattr(result, attr):
                markdown_text = getattr(result, attr)
                break
        
        if markdown_text is None:
            print("Error: SDK result did not include markdown content.", file=sys.stderr)
            sys.exit(1)
        
        # Write to output file
        output_file = Path('${outputFilePath}')
        output_file.write_text(markdown_text, encoding='utf-8')
        
        print(f"SUCCESS:{len(markdown_text)}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    convert_single_file()
`;

      // Write the Python script to a temporary file
      const scriptPath = path.join(tempDir, 'convert_pdf.py');
      fs.writeFileSync(scriptPath, pythonScript);

      // Execute the Python script
      const pythonProcess = spawn('python3', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, DATALAB_API_KEY: datalabApiKey }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const exitCode = await new Promise<number>((resolve) => {
        pythonProcess.on('close', resolve);
      });

      // Clean up temporary files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up temporary directory:', cleanupError);
      }

      if (exitCode !== 0) {
        throw new Error(`Python conversion failed: ${stderr || 'Unknown error'}`);
      }

      // Check if output file was created
      if (!fs.existsSync(outputFilePath)) {
        throw new Error('Output markdown file was not created');
      }

      // Read the converted content
      const markdownContent = fs.readFileSync(outputFilePath, 'utf8');
      const conversionTime = Date.now() - startTime;
      
      console.log(`✅ PDF converted successfully: ${outputFilePath} (${conversionTime}ms)`);
      console.log(`📄 Generated ${markdownContent.length} characters of markdown`);

      return {
        markdownContent,
        outputFilePath,
        metadata: {
          originalFileName: path.basename(pdfFilePath),
          fileSize: fileStats.size,
          conversionTime,
          pageCount: undefined, // Python SDK might not return page count easily
        },
      };

    } catch (error) {
      console.error('Error converting PDF with Python Datalab SDK:', error);
      throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
