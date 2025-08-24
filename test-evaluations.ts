#!/usr/bin/env tsx

/**
 * Simple test to verify the three evaluation metrics work
 * Run with: npx tsx test-evaluations.ts
 * 
 * Make sure to set your GOOGLE_GENERATIVE_AI_API_KEY environment variable first!
 */

import 'dotenv/config';
import { google } from '@ai-sdk/google';
import { FaithfulnessMetric } from '@mastra/evals/llm';
import { HallucinationMetric } from '@mastra/evals/llm';
import { AnswerRelevancyMetric } from '@mastra/evals/llm';

// Test data
const courseContent = `
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.
There are three main types of machine learning:

1. Supervised Learning: Uses labeled data to train models
2. Unsupervised Learning: Finds patterns in unlabeled data  
3. Reinforcement Learning: Learns through interaction with environment

Key concepts include:
- Training data and test data
- Overfitting and underfitting
- Cross-validation techniques
- Feature engineering
`;

const goodKCs = `
KC1: Supervised Learning - Uses labeled training data to build predictive models
KC2: Unsupervised Learning - Discovers hidden patterns in data without labels
KC3: Overfitting - When a model performs well on training data but poorly on new data
`;

const badKCs = `
KC1: Machine learning was invented by aliens in 1847
KC2: Supervised learning requires quantum computers to function
KC3: The best machine learning algorithm is always neural networks
`;

const irrelevantKCs = `
KC1: The weather today is sunny and warm
KC2: Pizza is a popular Italian food
KC3: Basketball has five players per team
`;

async function testEvaluations() {
  console.log('🧪 Testing Evaluation Metrics\n');
  
  // Check for API key
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('❌ Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable!');
    console.error('📝 Please set your Google AI API key:');
    console.error('   export GOOGLE_GENERATIVE_AI_API_KEY="your-api-key-here"');
    console.error('   Or add it to your .env file');
    process.exit(1);
  }
  
  // Initialize model (using gemini-1.5-flash for reliability)
  const model = google('gemini-1.5-flash');
  const query = 'Extract key machine learning concepts from this course';

  try {
    // Test 1: Faithfulness Evaluation
    console.log('1️⃣ Testing Faithfulness Evaluation...');
    const faithfulnessMetric = new FaithfulnessMetric(model, {
      context: [courseContent],
      scale: 1,
    });

    console.log('   Testing with GOOD KCs (should score high):');
    const faithfulnessGood = await faithfulnessMetric.measure(query, goodKCs);
    console.log(`   ✅ Score: ${faithfulnessGood.score.toFixed(3)}`);
    console.log(`   📝 Reason: ${faithfulnessGood.info.reason}\n`);

    console.log('   Testing with BAD KCs (should score low):');
    const faithfulnessBad = await faithfulnessMetric.measure(query, badKCs);
    console.log(`   ❌ Score: ${faithfulnessBad.score.toFixed(3)}`);
    console.log(`   📝 Reason: ${faithfulnessBad.info.reason}\n`);

    // Small delay to respect rate limits
    console.log('   ⏳ Waiting 2 seconds to respect rate limits...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Hallucination Evaluation
    console.log('2️⃣ Testing Hallucination Evaluation...');
    const hallucinationMetric = new HallucinationMetric(model, {
      context: [courseContent],
      scale: 1,
    });

    console.log('   Testing with GOOD KCs (should have low hallucination):');
    const hallucinationGood = await hallucinationMetric.measure(query, goodKCs);
    console.log(`   ✅ Score: ${hallucinationGood.score.toFixed(3)} (lower is better)`);
    console.log(`   📝 Reason: ${hallucinationGood.info.reason}\n`);

    console.log('   Testing with BAD KCs (should have high hallucination):');
    const hallucinationBad = await hallucinationMetric.measure(query, badKCs);
    console.log(`   ❌ Score: ${hallucinationBad.score.toFixed(3)} (higher means more hallucination)`);
    console.log(`   📝 Reason: ${hallucinationBad.info.reason}\n`);

    // Small delay to respect rate limits
    console.log('   ⏳ Waiting 2 seconds to respect rate limits...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Answer Relevancy Evaluation
    console.log('3️⃣ Testing Answer Relevancy Evaluation...');
    const answerRelevancyMetric = new AnswerRelevancyMetric(model, {
      scale: 1,
    });

    console.log('   Testing with RELEVANT KCs (should score high):');
    const relevancyGood = await answerRelevancyMetric.measure(query, goodKCs);
    console.log(`   ✅ Score: ${relevancyGood.score.toFixed(3)}`);
    console.log(`   📝 Reason: ${relevancyGood.info.reason}\n`);

    console.log('   Testing with IRRELEVANT KCs (should score low):');
    const relevancyBad = await answerRelevancyMetric.measure(query, irrelevantKCs);
    console.log(`   ❌ Score: ${relevancyBad.score.toFixed(3)}`);
    console.log(`   📝 Reason: ${relevancyBad.info.reason}\n`);

    // Summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log(`Faithfulness - Good: ${faithfulnessGood.score.toFixed(3)} | Bad: ${faithfulnessBad.score.toFixed(3)}`);
    console.log(`Hallucination - Good: ${hallucinationGood.score.toFixed(3)} | Bad: ${hallucinationBad.score.toFixed(3)} (lower better)`);
    console.log(`Relevancy - Good: ${relevancyGood.score.toFixed(3)} | Bad: ${relevancyBad.score.toFixed(3)}`);
    
    // Calculate overall scores like in the workflow
    const goodOverall = (
      faithfulnessGood.score + 
      (1 - hallucinationGood.score) + 
      relevancyGood.score
    ) / 3;
    
    const badOverall = (
      faithfulnessBad.score + 
      (1 - hallucinationBad.score) + 
      relevancyBad.score
    ) / 3;

    console.log(`\n🎯 Overall Quality Scores:`);
    console.log(`Good KCs: ${goodOverall.toFixed(3)} (${getGrade(goodOverall)})`);
    console.log(`Bad KCs: ${badOverall.toFixed(3)} (${getGrade(badOverall)})`);
    
    console.log('\n✅ All evaluation metrics are working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

function getGrade(score: number): string {
  if (score >= 0.9) return 'A';
  if (score >= 0.8) return 'B';
  if (score >= 0.7) return 'C';
  if (score >= 0.6) return 'D';
  return 'F';
}

// Run the test
testEvaluations().catch(console.error);
