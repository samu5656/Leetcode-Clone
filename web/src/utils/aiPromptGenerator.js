/**
 * AI Prompt Generator for Problem Creation
 * Generates structured prompts for external AI tools (ChatGPT, Claude, etc.)
 */

export function generateAIPrompt(problemIdea) {
  const prompt = `You are an expert at creating LeetCode-style coding problems for a competitive programming platform.

**Problem Idea:**
${problemIdea}

**Task:** Create a complete, well-structured coding problem based on this idea.

**CRITICAL: Your response must be ONLY the JSON object below, with no additional text before or after.**

**OUTPUT FORMAT (strict JSON):**
\`\`\`json
{
  "title": "Two Sum",
  "slug": "two-sum",
  "difficulty": "easy",
  "description": "Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.\\n\\nYou may assume each input has **exactly one solution**, and you may not use the same element twice.\\n\\n**Example 1:**\\n\`\`\`\\nInput: nums = [2,7,11,15], target = 9\\nOutput: [0,1]\\n\`\`\`\\n\\n**Constraints:**\\n- 2 ≤ nums.length ≤ 10⁴",
  "function_signature": "twoSum(nums: int[], target: int) -> int[]",
  "time_limit_ms": 2000,
  "memory_limit_kb": 262144,
  "test_cases": [
    {
      "input": "9\\n2 7 11 15",
      "expected_output": "0 1",
      "is_sample": true
    },
    {
      "input": "6\\n3 2 4",
      "expected_output": "1 2",
      "is_sample": true
    },
    {
      "input": "6\\n3 3",
      "expected_output": "0 1",
      "is_sample": false
    }
  ],
  "boilerplates": {
    "python": {
      "starter_code": "def twoSum(nums, target):\\n    # Write your code here\\n    pass",
      "test_harness": "{{USER_CODE}}\\n\\ntarget = int(input().strip())\\nnums = list(map(int, input().strip().split()))\\nresult = twoSum(nums, target)\\nprint(result[0], result[1])"
    },
    "javascript": {
      "starter_code": "function twoSum(nums, target) {\\n    // Write your code here\\n}",
      "test_harness": "{{USER_CODE}}\\n\\nconst readline = require(\\"readline\\");\\nconst rl = readline.createInterface({ input: process.stdin });\\nconst lines = [];\\nrl.on(\\"line\\", (l) => lines.push(l.trim()));\\nrl.on(\\"close\\", () => {\\n    const target = parseInt(lines[0]);\\n    const nums = lines[1].split(\\" \\").map(Number);\\n    const r = twoSum(nums, target);\\n    console.log(r[0] + \\" \\" + r[1]);\\n});"
    },
    "c++": {
      "starter_code": "vector<int> twoSum(vector<int>& nums, int target) {\\n    // Write your code here\\n}",
      "test_harness": "#include <iostream>\\n#include <vector>\\n#include <sstream>\\nusing namespace std;\\n\\n{{USER_CODE}}\\n\\nint main() {\\n    int target;\\n    cin >> target; cin.ignore();\\n    string line; getline(cin, line);\\n    istringstream iss(line);\\n    vector<int> nums; int x;\\n    while (iss >> x) nums.push_back(x);\\n    auto r = twoSum(nums, target);\\n    cout << r[0] << \\" \\" << r[1] << endl;\\n    return 0;\\n}"
    },
    "java": {
      "starter_code": "public static int[] twoSum(int[] nums, int target) {\\n    // Write your code here\\n    return new int[]{};\\n}",
      "test_harness": "import java.util.*;\\n\\npublic class Main {\\n    {{USER_CODE}}\\n\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n        int target = Integer.parseInt(sc.nextLine().trim());\\n        String[] parts = sc.nextLine().trim().split(\\" \\");\\n        int[] nums = new int[parts.length];\\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\\n        int[] r = twoSum(nums, target);\\n        System.out.println(r[0] + \\" \\" + r[1]);\\n    }\\n}"
    }
  }
}
\`\`\`

**REQUIREMENTS:**

1. **Title**: Clear, concise problem name
2. **Slug**: lowercase-with-hyphens URL-friendly version
3. **Difficulty**: Must be "easy", "medium", or "hard"
4. **Description**: 
   - Use markdown formatting
   - Include clear problem statement
   - Provide 2-3 examples with inputs and outputs
   - List constraints (array size limits, value ranges, etc.)
5. **Function Signature**: Language-agnostic signature showing input/output types
6. **Test Cases**: 
   - Provide 5-10 test cases
   - Mark 2-3 as sample (is_sample: true) - these are shown to users
   - Rest as hidden test cases
   - Input format: Plain text, one value per line or space-separated
   - Output format: Plain text matching expected format
7. **Boilerplates** (CRITICAL):
   - Must provide for all 4 languages: python, javascript, c++, java
   - **starter_code**: The function template users see (just the function definition)
   - **test_harness**: Code that reads input, calls user function, prints output
   - **MUST include {{USER_CODE}} placeholder** in test_harness
   - Test harness handles all I/O parsing and formatting
   - Use newline escaping (\\n) in JSON strings

**IMPORTANT NOTES:**
- Input/output should match the problem type (arrays, strings, integers, etc.)
- Test harness must correctly parse the input format specified
- All boilerplates must follow the same input/output format
- Difficulty should match problem complexity (easy = basic logic, medium = algorithms, hard = complex algorithms)

**Now generate the complete JSON for this problem. Output ONLY the JSON, nothing else.**`;

  return prompt;
}
