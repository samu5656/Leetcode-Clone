import { useState } from "react";
import { X, Upload, AlertCircle, CheckCircle2, Loader2, Copy } from "lucide-react";
import { adminAPI } from "../../../api";
import { useToast } from "../../../components/Toast";

const EXAMPLE_JSON = `{
  "problems": [
    {
      "title": "Two Sum",
      "slug": "two-sum",
      "description": "Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers that add up to \`target\`.\\n\\n**Example:**\\n\\n\`\`\`\\nInput: nums = [2,7,11,15], target = 9\\nOutput: [0,1]\\n\`\`\`",
      "difficulty": "easy",
      "function_signature": "def twoSum(nums: List[int], target: int) -> List[int]:",
      "time_limit_ms": 2000,
      "memory_limit_kb": 262144,
      "test_cases": [
        {
          "input": "[2,7,11,15]\\n9",
          "expected_output": "[0,1]",
          "is_sample": true
        },
        {
          "input": "[3,2,4]\\n6",
          "expected_output": "[1,2]",
          "is_sample": false
        }
      ],
      "boilerplates": [
        {
          "language": "python",
          "code": "====STARTER_CODE====\\ndef solution(nums, target):\\n    # Your code here\\n    pass\\n====STARTER_CODE====\\n\\nimport sys\\nimport json\\n\\nlines = sys.stdin.read().strip().split('\\\\n')\\nnums = json.loads(lines[0])\\ntarget = int(lines[1])\\n\\n{{USER_CODE}}\\n\\nresult = solution(nums, target)\\nprint(json.dumps(result))"
        },
        {
          "language": "javascript",
          "code": "====STARTER_CODE====\\nfunction solution(nums, target) {\\n    // Your code here\\n}\\n====STARTER_CODE====\\n\\nconst readline = require('readline');\\nconst rl = readline.createInterface({ input: process.stdin });\\nconst lines = [];\\n\\nrl.on('line', (line) => lines.push(line.trim()));\\nrl.on('close', () => {\\n    const nums = JSON.parse(lines[0]);\\n    const target = parseInt(lines[1]);\\n    \\n    {{USER_CODE}}\\n    \\n    const result = solution(nums, target);\\n    console.log(JSON.stringify(result));\\n});"
        },
        {
          "language": "c++",
          "code": "====STARTER_CODE====\\n#include <vector>\\nusing namespace std;\\n\\nclass Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        // Your code here\\n    }\\n};\\n====STARTER_CODE====\\n\\n#include <iostream>\\nusing namespace std;\\n\\n{{USER_CODE}}\\n\\nint main() {\\n    Solution sol;\\n    // Test harness\\n    return 0;\\n}"
        },
        {
          "language": "java",
          "code": "====STARTER_CODE====\\nclass Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        // Your code here\\n    }\\n}\\n====STARTER_CODE====\\n\\nimport java.util.*;\\n\\n{{USER_CODE}}\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Solution sol = new Solution();\\n        // Test harness\\n    }\\n}"
        }
      ]
    }
  ]
}`;

export default function BulkAddModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showExample, setShowExample] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      toast("Please provide JSON input", "error");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      
      if (!parsed.problems || !Array.isArray(parsed.problems)) {
        toast("JSON must contain a 'problems' array", "error");
        return;
      }

      setLoading(true);
      setResult(null);

      const res = await adminAPI.bulkCreateProblems(parsed);
      const resultData = res.data.result;
      
      setResult(resultData);

      if (resultData.success > 0) {
        toast(`Successfully created ${resultData.success} problem(s)`, "success");
        if (resultData.failed === 0) {
          setTimeout(() => {
            onSuccess?.();
            handleClose();
          }, 2000);
        }
      }

      if (resultData.failed > 0) {
        toast(`${resultData.failed} problem(s) failed to create`, "error");
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast("Invalid JSON format", "error");
      } else {
        const msg = err.response?.data?.error || "Failed to create problems";
        toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJsonInput("");
    setResult(null);
    setShowExample(false);
    onClose();
  };

  const copyExample = () => {
    navigator.clipboard.writeText(EXAMPLE_JSON);
    toast("Example JSON copied to clipboard", "success");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-[var(--border-line)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-main)] tracking-tight">Bulk Add Problems</h2>
            <p className="text-sm text-[var(--text-sub)] mt-1">Import multiple problems from JSON</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-alt)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          
          {/* Toggle Example */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setShowExample(!showExample)}
              className="text-sm font-medium text-[var(--accent)] hover:text-orange-600 transition-colors"
            >
              {showExample ? "Hide" : "Show"} Example JSON Format
            </button>
            {showExample && (
              <button
                onClick={copyExample}
                className="text-sm font-medium text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors flex items-center gap-2"
              >
                <Copy size={14} />
                Copy Example
              </button>
            )}
          </div>

          {/* Example JSON */}
          {showExample && (
            <div className="mb-6 bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto border border-[var(--border-line)]">
              <pre className="text-xs text-[#d4d4d4] font-mono leading-relaxed">
                {EXAMPLE_JSON}
              </pre>
            </div>
          )}

          {/* JSON Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              Paste JSON Object
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"problems": [...]}'
              className="w-full h-64 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm rounded-lg p-4 border border-[var(--border-line)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-y"
              spellCheck="false"
            />
          </div>

          {/* Result Display */}
          {result && (
            <div className="space-y-4">
              {result.success > 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-900">
                        Successfully created {result.success} problem{result.success !== 1 ? 's' : ''}
                      </h4>
                    </div>
                  </div>
                </div>
              )}

              {result.failed > 0 && result.errors && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900 mb-2">
                        {result.failed} problem{result.failed !== 1 ? 's' : ''} failed
                      </h4>
                      <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                        {result.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-[var(--border-line)] flex justify-between items-center">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-[var(--border-line)] hover:bg-[var(--bg-alt)] transition-colors text-[var(--text-main)]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !jsonInput.trim()}
            className="bg-[var(--accent)] hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Processing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Import Problems
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
