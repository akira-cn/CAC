import fs from 'node:fs';
import { join } from 'node:path';

/**
 * Load prompt content from markdown files
 * @param promptName - The name of the prompt file (without extension)
 * @returns string - The content of the prompt file
 */
export function loadPrompt(promptName: string): string {
  try {
    // Construct the path to the prompt file
    const promptPath = join(
      __dirname,
      'prompts',
      `${promptName.replace(/\.md$/, '')}.md`
    );

    // Read and return the file content
    const content = fs.readFileSync(promptPath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(
      `Failed to load prompt '${promptName}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
