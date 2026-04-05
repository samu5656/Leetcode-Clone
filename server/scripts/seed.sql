-- =============================================================================
-- DSA Contest Platform — Seed Data (5 Function-Only Problems)
-- =============================================================================
-- Admin:  admin@dsa-contest.com / Admin@123
-- User:   user@example.com / User@1234
-- Languages: Python, JavaScript, C++, Java
-- =============================================================================

TRUNCATE test_cases, boilerplates, contest_problems, submissions, contest_participants CASCADE;
DELETE FROM problems;
DELETE FROM contests;

-- ─── USERS ──────────────────────────────────────────────────────────────────

INSERT INTO users (email, username, password_hash, display_name, role)
VALUES (
    'admin@dsa-contest.com', 'admin',
    '$2a$12$3.Edmpo.wk6tPTabf.B5ee.1.su3OiKc8mxzgz.m1hzK.DyG3hk/e',
    'Admin', 'admin'
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, display_name = EXCLUDED.display_name, role = EXCLUDED.role;

INSERT INTO users (email, username, password_hash, display_name, role)
VALUES (
    'user@example.com', 'testuser',
    '$2a$12$q5xPHINJ6vR1FVhJoJSJ4OQv6liFh3wThIrOJ.eM3GqVtb6Lm6NTi',
    'Test User', 'user'
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, display_name = EXCLUDED.display_name, role = EXCLUDED.role;


-- #############################################################################
-- PROBLEM 1: Two Sum (Easy)
-- #############################################################################

INSERT INTO problems (id, title, slug, description, difficulty, function_signature, time_limit_ms, memory_limit_kb)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Two Sum',
    'two-sum',
    'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.

You may assume each input has **exactly one solution**, and you may not use the same element twice. Return the answer with the smaller index first.

**Example 1:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
```

**Constraints:**
- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i] ≤ 10⁹',
    'easy',
    'twoSum(nums: int[], target: int) -> int[]',
    2000, 256000
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
('a0000000-0000-0000-0000-000000000001', '9
2 7 11 15', '0 1', true),
('a0000000-0000-0000-0000-000000000001', '6
3 2 4', '1 2', true),
('a0000000-0000-0000-0000-000000000001', '6
3 3', '0 1', false),
('a0000000-0000-0000-0000-000000000001', '0
-1 0 1 2 -2', '0 2', false),
('a0000000-0000-0000-0000-000000000001', '10
1 5 5 9', '0 3', false);

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000001', 'python',
'====STARTER_CODE====
def twoSum(nums, target):
    # Write your code here
    pass
====STARTER_CODE====
import sys

{{USER_CODE}}

target = int(input().strip())
nums = list(map(int, input().strip().split()))
result = twoSum(nums, target)
print(result[0], result[1])');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000001', 'javascript',
'====STARTER_CODE====
function twoSum(nums, target) {
    // Write your code here
}
====STARTER_CODE====
{{USER_CODE}}

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on("line", (l) => lines.push(l.trim()));
rl.on("close", () => {
    const target = parseInt(lines[0]);
    const nums = lines[1].split(" ").map(Number);
    const r = twoSum(nums, target);
    console.log(r[0] + " " + r[1]);
});');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000001', 'c++',
'====STARTER_CODE====
vector<int> twoSum(vector<int>& nums, int target) {
    // Write your code here
}
====STARTER_CODE====
#include <iostream>
#include <vector>
#include <sstream>
#include <unordered_map>
using namespace std;

{{USER_CODE}}

int main() {
    int target;
    cin >> target; cin.ignore();
    string line; getline(cin, line);
    istringstream iss(line);
    vector<int> nums; int x;
    while (iss >> x) nums.push_back(x);
    auto r = twoSum(nums, target);
    cout << r[0] << " " << r[1] << endl;
    return 0;
}');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000001', 'java',
'====STARTER_CODE====
public static int[] twoSum(int[] nums, int target) {
    // Write your code here
    return new int[]{};
}
====STARTER_CODE====
import java.util.*;

public class Main {
    {{USER_CODE}}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int target = Integer.parseInt(sc.nextLine().trim());
        String[] parts = sc.nextLine().trim().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int[] r = twoSum(nums, target);
        System.out.println(r[0] + " " + r[1]);
    }
}');


-- #############################################################################
-- PROBLEM 2: Reverse String (Easy)
-- #############################################################################

INSERT INTO problems (id, title, slug, description, difficulty, function_signature, time_limit_ms, memory_limit_kb)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Reverse String',
    'reverse-string',
    'Write a function that reverses a string. The input string is given as a single line.

**Example 1:**
```
Input: s = "hello"
Output: "olleh"
```

**Constraints:**
- 1 ≤ s.length ≤ 10⁵',
    'easy',
    'reverseString(s: string) -> string',
    2000, 256000
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
('a0000000-0000-0000-0000-000000000002', 'hello', 'olleh', true),
('a0000000-0000-0000-0000-000000000002', 'LeetCode', 'edoCteeL', true),
('a0000000-0000-0000-0000-000000000002', 'a', 'a', false),
('a0000000-0000-0000-0000-000000000002', 'ab', 'ba', false),
('a0000000-0000-0000-0000-000000000002', 'racecar', 'racecar', false);

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000002', 'python',
'====STARTER_CODE====
def reverseString(s):
    # Write your code here
    return ""
====STARTER_CODE====
{{USER_CODE}}

s = input().strip()
print(reverseString(s))');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000002', 'javascript',
'====STARTER_CODE====
function reverseString(s) {
    // Write your code here
}
====STARTER_CODE====
{{USER_CODE}}

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
    console.log(reverseString(line.trim()));
    rl.close();
});');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000002', 'c++',
'====STARTER_CODE====
string reverseString(string s) {
    // Write your code here
}
====STARTER_CODE====
#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

{{USER_CODE}}

int main() {
    string s;
    getline(cin, s);
    cout << reverseString(s) << endl;
    return 0;
}');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000002', 'java',
'====STARTER_CODE====
public static String reverseString(String s) {
    // Write your code here
    return "";
}
====STARTER_CODE====
import java.util.*;

public class Main {
    {{USER_CODE}}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        System.out.println(reverseString(s));
    }
}');


-- #############################################################################
-- PROBLEM 3: Palindrome Number (Easy)
-- #############################################################################

INSERT INTO problems (id, title, slug, description, difficulty, function_signature, time_limit_ms, memory_limit_kb)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'Palindrome Number',
    'palindrome-number',
    'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.

Reads the same forward and backward.

**Example:**
```
Input: x = 121
Output: true
```

**Constraints:**
- -2³¹ ≤ x ≤ 2³¹ - 1',
    'easy',
    'isPalindrome(x: int) -> bool',
    2000, 256000
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
('a0000000-0000-0000-0000-000000000003', '121', 'true', true),
('a0000000-0000-0000-0000-000000000003', '-121', 'false', true),
('a0000000-0000-0000-0000-000000000003', '10', 'false', false),
('a0000000-0000-0000-0000-000000000003', '0', 'true', false),
('a0000000-0000-0000-0000-000000000003', '12321', 'true', false);

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000003', 'python',
'====STARTER_CODE====
def isPalindrome(x):
    # Write your code here
    pass
====STARTER_CODE====
{{USER_CODE}}

x = int(input().strip())
print("true" if isPalindrome(x) else "false")');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000003', 'javascript',
'====STARTER_CODE====
function isPalindrome(x) {
    // Write your code here
}
====STARTER_CODE====
{{USER_CODE}}

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
    console.log(isPalindrome(parseInt(line.trim())) ? "true" : "false");
    rl.close();
});');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000003', 'c++',
'====STARTER_CODE====
bool isPalindrome(int x) {
    // Write your code here
}
====STARTER_CODE====
#include <iostream>
#include <string>
using namespace std;

{{USER_CODE}}

int main() {
    int x;
    cin >> x;
    cout << (isPalindrome(x) ? "true" : "false") << endl;
    return 0;
}');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000003', 'java',
'====STARTER_CODE====
public static boolean isPalindrome(int x) {
    // Write your code here
    return false;
}
====STARTER_CODE====
import java.util.*;

public class Main {
    {{USER_CODE}}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = Integer.parseInt(sc.nextLine().trim());
        System.out.println(isPalindrome(x) ? "true" : "false");
    }
}');


-- #############################################################################
-- PROBLEM 4: Valid Anagram (Medium)
-- #############################################################################

INSERT INTO problems (id, title, slug, description, difficulty, function_signature, time_limit_ms, memory_limit_kb)
VALUES (
    'a0000000-0000-0000-0000-000000000004',
    'Valid Anagram',
    'valid-anagram',
    'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

**Example 1:**
```
Input: s = "anagram", t = "nagaram"
Output: true
```

**Constraints:**
- 1 ≤ s.length, t.length ≤ 5 × 10⁴
- s and t consist of lowercase English letters.',
    'medium',
    'isAnagram(s: string, t: string) -> bool',
    2000, 256000
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
('a0000000-0000-0000-0000-000000000004', 'anagram
nagaram', 'true', true),
('a0000000-0000-0000-0000-000000000004', 'rat
car', 'false', true),
('a0000000-0000-0000-0000-000000000004', 'listen
silent', 'true', false),
('a0000000-0000-0000-0000-000000000004', 'hello
world', 'false', false),
('a0000000-0000-0000-0000-000000000004', 'a
a', 'true', false);

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000004', 'python',
'====STARTER_CODE====
def isAnagram(s, t):
    # Write your code here
    pass
====STARTER_CODE====
{{USER_CODE}}

s = input().strip()
t = input().strip()
print("true" if isAnagram(s, t) else "false")');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000004', 'javascript',
'====STARTER_CODE====
function isAnagram(s, t) {
    // Write your code here
}
====STARTER_CODE====
{{USER_CODE}}

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on("line", (l) => lines.push(l.trim()));
rl.on("close", () => {
    console.log(isAnagram(lines[0], lines[1]) ? "true" : "false");
});');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000004', 'c++',
'====STARTER_CODE====
bool isAnagram(string s, string t) {
    // Write your code here
}
====STARTER_CODE====
#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

{{USER_CODE}}

int main() {
    string s, t;
    getline(cin, s);
    getline(cin, t);
    cout << (isAnagram(s, t) ? "true" : "false") << endl;
    return 0;
}');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000004', 'java',
'====STARTER_CODE====
public static boolean isAnagram(String s, String t) {
    // Write your code here
    return false;
}
====STARTER_CODE====
import java.util.*;

public class Main {
    {{USER_CODE}}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        String t = sc.nextLine().trim();
        System.out.println(isAnagram(s, t) ? "true" : "false");
    }
}');


-- #############################################################################
-- PROBLEM 5: Maximum Subarray (Medium)
-- #############################################################################

INSERT INTO problems (id, title, slug, description, difficulty, function_signature, time_limit_ms, memory_limit_kb)
VALUES (
    'a0000000-0000-0000-0000-000000000005',
    'Maximum Subarray',
    'maximum-subarray',
    'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.

**Example 1:**
```
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
```

**Constraints:**
- 1 ≤ nums.length ≤ 10⁵
- -10⁴ ≤ nums[i] ≤ 10⁴',
    'medium',
    'maxSubArray(nums: int[]) -> int',
    2000, 256000
);

INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
('a0000000-0000-0000-0000-000000000005', '-2 1 -3 4 -1 2 1 -5 4', '6', true),
('a0000000-0000-0000-0000-000000000005', '1', '1', true),
('a0000000-0000-0000-0000-000000000005', '5 4 -1 7 8', '23', false),
('a0000000-0000-0000-0000-000000000005', '-1', '-1', false),
('a0000000-0000-0000-0000-000000000005', '-2 -1', '-1', false);

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000005', 'python',
'====STARTER_CODE====
def maxSubArray(nums):
    # Write your code here
    pass
====STARTER_CODE====
{{USER_CODE}}

nums = list(map(int, input().strip().split()))
print(maxSubArray(nums))');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000005', 'javascript',
'====STARTER_CODE====
function maxSubArray(nums) {
    // Write your code here
}
====STARTER_CODE====
{{USER_CODE}}

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
    const nums = line.trim().split(" ").map(Number);
    console.log(maxSubArray(nums));
    rl.close();
});');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000005', 'c++',
'====STARTER_CODE====
int maxSubArray(vector<int>& nums) {
    // Write your code here
}
====STARTER_CODE====
#include <iostream>
#include <vector>
#include <sstream>
#include <climits>
using namespace std;

{{USER_CODE}}

int main() {
    string line;
    getline(cin, line);
    istringstream iss(line);
    vector<int> nums;
    int x;
    while (iss >> x) nums.push_back(x);
    cout << maxSubArray(nums) << endl;
    return 0;
}');

INSERT INTO boilerplates (problem_id, language, code) VALUES
('a0000000-0000-0000-0000-000000000005', 'java',
'====STARTER_CODE====
public static int maxSubArray(int[] nums) {
    // Write your code here
    return 0;
}
====STARTER_CODE====
import java.util.*;

public class Main {
    {{USER_CODE}}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().trim().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        System.out.println(maxSubArray(nums));
    }
}');

-- =============================================================================
-- CONTEST
-- =============================================================================

INSERT INTO contests (id, title, start_time, end_time)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Weekly Challenge #1',
    NOW() + INTERVAL '1 hour',
    NOW() + INTERVAL '3 hours'
) ON CONFLICT DO NOTHING;

INSERT INTO contest_problems (contest_id, problem_id, points) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 100),
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 150),
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 200)
ON CONFLICT DO NOTHING;
