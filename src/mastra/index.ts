
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { kcMultiAgentPhase3Workflow } from './workflows/kc-multi-agent-phase3.workflow';
import { kcExtractionFullCircleWorkflow } from './workflows/kc-extraction-full-circle.workflow';

// Import specialized agent creators for Phase 3
import { createMasterConsolidatorAgent } from './agents/master-consolidator.agent';
import { createAnchorsAgent } from './agents/anchors-agent';
import { createAssessmentAgent } from './agents/assessment-agent';
import { createAtomicityAgent } from './agents/atomicity-agent';
import { createBloomAgent } from './agents/bloom-agent';

// Create specialized agent instances for Phase 3 using Gemini model
const masterConsolidator = createMasterConsolidatorAgent('google:gemini-2.5-pro');
const anchorsAgent = createAnchorsAgent('google:gemini-2.5-pro');
const assessmentAgent = createAssessmentAgent('google:gemini-2.5-pro');
const atomicityAgent = createAtomicityAgent('google:gemini-2.5-pro');
const bloomAgent = createBloomAgent('google:gemini-2.5-pro');

export const mastra = new Mastra({
  workflows: { 
    kcMultiAgentPhase3Workflow,
    kcExtractionFullCircleWorkflow,
  },
  agents: {
    masterConsolidator,
    anchorsAgent,
    assessmentAgent,
    atomicityAgent,
    bloomAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
