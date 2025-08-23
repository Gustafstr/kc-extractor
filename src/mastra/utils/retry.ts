/**
 * Simple retry wrapper for agent.generate calls with schema validation
 */
export async function retryAgentGenerate<T>(
  generateFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateFn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a schema validation error
      if (error instanceof Error && 
          (error.message.includes('No object generated') || 
           error.message.includes('response did not match schema'))) {
        
        console.log(`⚠️  Schema validation failed (attempt ${attempt}/${maxRetries}). Retrying...`);
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }
      
      // If it's not a schema error or we're out of retries, throw
      throw error;
    }
  }
  
  // If we get here, we've exhausted all retries
  throw lastError || new Error('Failed after all retries');
}
