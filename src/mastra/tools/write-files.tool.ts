import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { KCArraySchema, KC } from '../schemas/kc';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const inputSchema = z.object({
  outDir: z.string(),
  kcs: KCArraySchema,
  evalReport: z.any(),
  trace: z.any(),
});

const outputSchema = z.object({
  written: z.array(z.string()),
});

function toTableMd(kcs: KC[]): string {
  const headers = ['kc_id', 'label', 'definition', 'module', 'bloom', 'anchors', 'example_assessment'];
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ];
  for (const kc of kcs) {
    lines.push(
      `| ${kc.kc_id} | ${kc.label} | ${kc.definition} | ${kc.module} | ${kc.bloom} | ${kc.anchors.join(', ')} | ${kc.example_assessment} |`,
    );
  }
  return lines.join('\n');
}

export const writeFilesTool = createTool({
  id: 'write-kc-artifacts',
  description: 'Write KC artifacts and trace to disk',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { outDir, kcs, evalReport, trace } = context;
    await fs.mkdir(outDir, { recursive: true });

    const publicKcs = kcs.map(({ kc_id, label, definition, anchors, module, bloom, prerequisites, example_assessment, notes_for_expert }) => ({
      kc_id,
      label,
      definition,
      anchors,
      module,
      bloom,
      prerequisites,
      example_assessment,
      notes_for_expert,
    } satisfies KC));

    const files: { name: string; data: string }[] = [
      { name: 'course_master.kcs.json', data: JSON.stringify(publicKcs, null, 2) },
      { name: 'course_master.kcs.table.md', data: toTableMd(publicKcs) },
      { name: 'course_master.eval.json', data: JSON.stringify(evalReport, null, 2) },
      { name: 'trace.json', data: JSON.stringify(trace, null, 2) },
    ];

    const written: string[] = [];
    for (const f of files) {
      const target = path.join(outDir, f.name);
      await fs.writeFile(target, f.data, 'utf-8');
      written.push(target);
    }
    return { written };
  },
});


