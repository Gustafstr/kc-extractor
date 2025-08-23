
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { kcSimpleWorkflow } from './workflows/kc-simple.workflow';
import { kcMultiAgentWorkflow } from './workflows/kc-multi-agent.workflow';
import { kcMultiAgentPhase2Workflow } from './workflows/kc-multi-agent-phase2.workflow';
import { testWorkflow } from './workflows/test-extraction.workflow';

export const mastra = new Mastra({
  workflows: { 
    kcSimpleWorkflow, 
    kcMultiAgentWorkflow, 
    kcMultiAgentPhase2Workflow, 
    testWorkflow 
  },
  agents: {},
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
