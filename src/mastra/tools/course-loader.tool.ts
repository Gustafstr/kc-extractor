import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const inputSchema = z.object({
  dir: z.string().describe('Directory containing .md files and optional .anchors.json files'),
});

const outputSchema = z.object({
  combinedContent: z.string().describe('All markdown content combined with separators'),
  anchorList: z.array(z.string()).describe('All anchor IDs from .anchors.json files'),
  courseMetadata: z.object({
    title: z.string(),
    totalFiles: z.number(),
    totalAnchors: z.number(),
  }),
  fileList: z.array(z.string()).describe('List of processed markdown files'),
});

export const courseLoaderTool = createTool({
  id: 'course-loader',
  description: 'Load and combine all course markdown files with metadata extraction',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { dir } = context;
    
    // Resolve directory path (handle both absolute and relative paths)
    const cwd = process.cwd();
    let baseDir = dir;
    
    if (!path.isAbsolute(baseDir)) {
      const primary = path.resolve(cwd, baseDir);
      try {
        const st = await fs.stat(primary);
        if (st.isDirectory()) {
          baseDir = primary;
        } else {
          throw new Error('not dir');
        }
      } catch {
        const alt = path.resolve(cwd, '../../', baseDir);
        try {
          const st2 = await fs.stat(alt);
          if (st2.isDirectory()) {
            baseDir = alt;
          } else {
            throw new Error('not dir');
          }
        } catch {
          throw new Error(`Directory not found. Tried: ${primary} and ${alt}`);
        }
      }
    }

    // Read directory contents
    const entries = await fs.readdir(baseDir);
    
    // Find all .md files
    const mdFiles = entries
      .filter(e => e.toLowerCase().endsWith('.md'))
      .sort(); // Alphabetical order for consistency
    
    if (mdFiles.length === 0) {
      throw new Error(`No .md files found in ${baseDir}`);
    }

    // Find all .anchors.json files
    const anchorFiles = entries
      .filter(e => e.toLowerCase().endsWith('.anchors.json'))
      .sort();

    // Load and combine markdown content
    let combinedContent = '';
    let courseTitle = 'Untitled Course';
    const fileList: string[] = [];

    for (const mdFile of mdFiles) {
      const filePath = path.join(baseDir, mdFile);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract course title from first file's frontmatter
      if (fileList.length === 0) {
        const frontmatterMatch = content.match(/^---\s*\n(.*?)\n---/s);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const titleMatch = frontmatter.match(/course:\s*["'](.+?)["']/);
          if (titleMatch) {
            courseTitle = titleMatch[1];
          }
        }
      }

      // Add file separator and content
      combinedContent += `\n--- FILE: ${mdFile} ---\n${content}\n`;
      fileList.push(mdFile);
    }

    // Load and combine anchor IDs
    const anchorList: string[] = [];
    
    for (const anchorFile of anchorFiles) {
      try {
        const anchorPath = path.join(baseDir, anchorFile);
        const anchorContent = await fs.readFile(anchorPath, 'utf-8');
        
        if (!anchorContent.trim()) {
          continue;
        }
        
        const anchors = JSON.parse(anchorContent);
        
        if (!anchors) {
          continue;
        }
        
        // Extract anchor IDs (assuming they're in an array or object with id field)
        if (Array.isArray(anchors)) {
          anchors.forEach(anchor => {
            if (typeof anchor === 'string') {
              anchorList.push(anchor);
            } else if (anchor && typeof anchor === 'object' && anchor.id) {
              anchorList.push(anchor.id);
            }
          });
        } else if (typeof anchors === 'object' && anchors.anchors && Array.isArray(anchors.anchors)) {
          anchors.anchors.forEach((anchor: any) => {
            if (typeof anchor === 'string') {
              anchorList.push(anchor);
            } else if (anchor && typeof anchor === 'object' && anchor.id) {
              anchorList.push(anchor.id);
            }
          });
        }
      } catch (error) {
        // Silently skip malformed anchor files
      }
    }

    // Remove duplicates from anchor list
    const uniqueAnchors = [...new Set(anchorList)];

    const result = {
      combinedContent: combinedContent.trim(),
      anchorList: uniqueAnchors,
      courseMetadata: {
        title: courseTitle,
        totalFiles: mdFiles.length,
        totalAnchors: uniqueAnchors.length,
      },
      fileList,
    };

    return result;
  },
});
