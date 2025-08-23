#!/usr/bin/env node
import 'dotenv/config';
import { kcSimpleWorkflow } from '../src/mastra/workflows/kc-simple.workflow';

async function main() {
  const args = process.argv.slice(2);
  const inDir = args[0] || 'src/mastra/Input';
  const outDir = args[1] || 'out';
  const model = args[2] || 'google:gemini-2.5-pro';

  try {
    const run = await kcSimpleWorkflow.createRunAsync();
    const res = await run.start({
      inputData: { dir: inDir, model, outDir },
    });
    if ((res as any)?.status !== 'success') {
      throw new Error('Workflow failed: ' + JSON.stringify(res, null, 2));
    }
    const result = (res as any).result as { written: string[] };

    console.log('Written files:');
    for (const p of result.written) console.log(' -', p);
    process.exit(0);
  } catch (err) {
    console.error('Workflow failed:', (err as Error).message);
    process.exit(1);
  }
}

main();


