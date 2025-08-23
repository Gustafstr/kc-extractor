import { z } from 'zod';

export const BloomEnum = z.enum([
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
]);

export const KCSchema = z.object({
  kc_id: z.string(),
  label: z.string().max(80),
  definition: z.string().max(160),
  anchors: z.array(z.string()).nonempty(),
  module: z.string(),
  bloom: BloomEnum,
  prerequisites: z.array(z.string()).optional(),
  example_assessment: z.string().max(120),
  notes_for_expert: z.string().max(120).optional(),
});

export type Bloom = z.infer<typeof BloomEnum>;
export type KC = z.infer<typeof KCSchema>;

export const KCArraySchema = z.array(KCSchema);

export const KCExtendedSchema = KCSchema.extend({
  evidence_score: z.number().min(0).max(1).optional(),
  dup_group: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  anti_example: z.string().optional(),
  misconceptions: z.array(z.string()).optional(),
});

export type KC_Extended = z.infer<typeof KCExtendedSchema>;


