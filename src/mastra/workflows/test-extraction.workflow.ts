import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { KCArraySchema } from '../schemas/kc';
import { createBasicKCExtractorAgent, createKCExtractionPrompt } from '../agents/basic-kc-extractor.agent';

// Test workflow that only does KC extraction with mock data
const testExtractionStep = createStep({
  id: 'test-extraction',
  description: 'Test KC extraction with sample content',
  inputSchema: z.object({
    model: z.string().default('google:gemini-2.5-pro'),
  }),
  outputSchema: z.object({
    kcs: KCArraySchema,
    prompt: z.string(),
    promptLength: z.number(),
  }),
  execute: async ({ inputData }) => {
    // Mock course content for testing
    const mockContent = `
--- FILE: diversity-sample.md ---
# Diversity in the Workplace

Diversity can be defined as acknowledging, understanding, accepting, and valuing differences among people with respect to age, class, race, ethnicity, gender, disabilities, etc.

Companies need to embrace diversity and look for ways to become inclusive organizations because diversity has the potential to yield greater work productivity and competitive advantages.

Managing diversity is a significant organizational challenge, so managerial skills must adapt to accommodate a multicultural work environment.
    `;

    const mockAnchors = ['S0.p1', 'S0.p2', 'S0.p3', 'S0.p4'];
    const mockTitle = 'Test Diversity Course';

    const agent = createBasicKCExtractorAgent(inputData.model);
    const prompt = createKCExtractionPrompt(mockContent, mockAnchors, mockTitle);

    const response = await agent.generate(
      [{ role: 'user', content: prompt }],
      { output: KCArraySchema }
    );

    const kcs = response.object;
    if (!kcs) {
      throw new Error('Agent did not produce structured KC output');
    }

    return {
      kcs,
      prompt,
      promptLength: prompt.length,
    };
  },
});

const testWorkflow = createWorkflow({
  id: 'test-kc-extraction',
  description: 'Test KC extraction step in isolation',
  inputSchema: z.object({
    model: z.string().default('google:gemini-2.5-pro'),
  }),
  outputSchema: z.object({
    kcs: KCArraySchema,
    prompt: z.string(),
    promptLength: z.number(),
  }),
})
  .then(testExtractionStep);

testWorkflow.commit();

export { testWorkflow };
