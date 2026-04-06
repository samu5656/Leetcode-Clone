/**
 * AI Output Parser
 * Parses and validates AI-generated problem JSON
 */

export function parseAIOutput(aiOutput) {
  if (!aiOutput || !aiOutput.trim()) {
    throw new Error('AI output is empty');
  }

  try {
    // Try to extract JSON from markdown code blocks
    let jsonStr = aiOutput.trim();
    
    // Check for markdown code blocks
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }
    
    // Remove any text before first { and after last }
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in the output');
    }
    
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    
    // Parse JSON
    const parsed = JSON.parse(jsonStr);
    
    // Validate required fields
    validateProblemData(parsed);
    
    // Transform to form format
    return transformToFormData(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
    throw error;
  }
}

function validateProblemData(data) {
  const required = [
    'title',
    'description',
    'function_signature',
    'test_cases',
    'boilerplates'
  ];
  
  const missing = required.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate difficulty
  if (data.difficulty && !['easy', 'medium', 'hard'].includes(data.difficulty)) {
    throw new Error('Difficulty must be "easy", "medium", or "hard"');
  }
  
  // Validate test cases
  if (!Array.isArray(data.test_cases) || data.test_cases.length === 0) {
    throw new Error('At least one test case is required');
  }
  
  for (let i = 0; i < data.test_cases.length; i++) {
    const tc = data.test_cases[i];
    if (!tc.input || !tc.expected_output) {
      throw new Error(`Test case #${i + 1} is missing input or expected_output`);
    }
  }
  
  // Validate boilerplates
  if (typeof data.boilerplates !== 'object') {
    throw new Error('Boilerplates must be an object');
  }
  
  const requiredLanguages = ['python', 'javascript', 'c++', 'java'];
  const missingLanguages = requiredLanguages.filter(lang => !data.boilerplates[lang]);
  
  if (missingLanguages.length > 0) {
    throw new Error(`Missing boilerplates for: ${missingLanguages.join(', ')}`);
  }
  
  // Validate each boilerplate has required fields
  for (const lang of requiredLanguages) {
    const bp = data.boilerplates[lang];
    if (!bp.starter_code || !bp.test_harness) {
      throw new Error(`${lang} boilerplate is missing starter_code or test_harness`);
    }
    if (!bp.test_harness.includes('{{USER_CODE}}')) {
      throw new Error(`${lang} test_harness must contain {{USER_CODE}} placeholder`);
    }
  }
}

function transformToFormData(parsed) {
  // Generate slug if not provided
  const slug = parsed.slug || generateSlug(parsed.title);
  
  // Transform boilerplates to the format expected by the form
  // The form expects {language, starter_code, test_harness} not {language, code}
  const boilerplates = Object.entries(parsed.boilerplates).map(([lang, bp]) => ({
    language: lang,
    starter_code: bp.starter_code,
    test_harness: bp.test_harness
  }));
  
  return {
    title: parsed.title,
    slug: slug,
    description: parsed.description,
    difficulty: parsed.difficulty || 'easy',
    function_signature: parsed.function_signature,
    time_limit_ms: parsed.time_limit_ms || 2000,
    memory_limit_kb: parsed.memory_limit_kb || 262144,
    test_cases: parsed.test_cases.map(tc => ({
      input: tc.input,
      expected_output: tc.expected_output,
      is_sample: tc.is_sample !== undefined ? tc.is_sample : false
    })),
    boilerplates: boilerplates
  };
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Validates the parsed data before form submission
 */
export function validateBeforeSubmit(formData) {
  const errors = [];
  
  if (!formData.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!formData.slug?.trim()) {
    errors.push('Slug is required');
  }
  
  if (!formData.description?.trim()) {
    errors.push('Description is required');
  }
  
  if (!formData.function_signature?.trim()) {
    errors.push('Function signature is required');
  }
  
  if (!formData.test_cases || formData.test_cases.length === 0) {
    errors.push('At least one test case is required');
  }
  
  if (!formData.boilerplates || formData.boilerplates.length === 0) {
    errors.push('Boilerplates are required');
  }
  
  // Validate all boilerplates have required fields
  if (formData.boilerplates) {
    for (const bp of formData.boilerplates) {
      // Check if boilerplate has the separate format (starter_code + test_harness)
      if (bp.starter_code !== undefined && bp.test_harness !== undefined) {
        if (!bp.test_harness.includes('{{USER_CODE}}')) {
          errors.push(`${bp.language} test harness must contain {{USER_CODE}} placeholder`);
        }
      }
      // Check if boilerplate has the combined format (code with delimiters)
      else if (bp.code !== undefined) {
        if (!bp.code.includes('{{USER_CODE}}')) {
          errors.push(`${bp.language} boilerplate must contain {{USER_CODE}} placeholder`);
        }
        if (!bp.code.includes('====STARTER_CODE====')) {
          errors.push(`${bp.language} boilerplate must contain ====STARTER_CODE==== delimiters`);
        }
      }
      else {
        errors.push(`${bp.language} boilerplate is missing required fields`);
      }
    }
  }
  
  return errors;
}
