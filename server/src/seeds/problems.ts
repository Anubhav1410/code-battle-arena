import mongoose from 'mongoose'
import { Problem } from '../models/Problem'
import { env } from '../config/env'

const problems = [
  // 1. Two Sum
  {
    title: 'Two Sum',
    slug: 'two-sum',
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

### Input Format

- The first line contains two space-separated integers \`n\` (the size of the array) and \`target\`.
- The second line contains \`n\` space-separated integers representing the array \`nums\`.

### Output Format

- Print two space-separated integers representing the indices (0-based) of the two numbers that add up to \`target\`. Print the smaller index first.

### Notes

- There is guaranteed to be exactly one valid answer.
- You may not use the same element twice.`,
    difficulty: 'easy' as const,
    tags: ['array', 'hash-table'],
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    examples: [
      {
        input: '4 9\n2 7 11 15',
        output: '0 1',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: '3 6\n3 2 4',
        output: '1 2',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: '2 6\n3 3',
        output: '0 1',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].',
      },
    ],
    testCases: [
      { input: '4 9\n2 7 11 15', expectedOutput: '0 1', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '3 6\n3 2 4', expectedOutput: '1 2', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '2 6\n3 3', expectedOutput: '0 1', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '5 10\n1 2 3 4 6', expectedOutput: '3 4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4 0\n-1 0 1 2', expectedOutput: '0 2', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '6 8\n1 5 3 7 4 2', expectedOutput: '1 2', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2 -1\n-3 2', expectedOutput: '0 1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5 100\n10 20 30 40 60', expectedOutput: '3 4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here

    return 0;
}`,
      python: `n, target = map(int, input().split())
nums = list(map(int, input().split()))

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const [n, target] = lines[0].split(' ').map(Number)
    const nums = lines[1].split(' ').map(Number)

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 2. Reverse String
  {
    title: 'Reverse String',
    slug: 'reverse-string',
    description: `## Reverse String

Write a function that reverses a string. The input string is given as a single line of characters.

### Input Format

- A single line containing the string \`s\` to be reversed.

### Output Format

- Print the reversed string on a single line.

### Notes

- The string may contain any printable ASCII characters, including spaces.
- You must reverse the entire string, including any leading or trailing spaces.
- Try to do it in-place with O(1) extra memory for an optimal solution.`,
    difficulty: 'easy' as const,
    tags: ['string', 'two-pointers'],
    constraints: '1 <= s.length <= 10^5\ns consists of printable ASCII characters.',
    examples: [
      {
        input: 'hello',
        output: 'olleh',
        explanation: 'The string "hello" reversed is "olleh".',
      },
      {
        input: 'Hannah',
        output: 'hannaH',
        explanation: 'The string "Hannah" reversed is "hannaH". Note the case is preserved per character.',
      },
    ],
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'Hannah', expectedOutput: 'hannaH', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'a', expectedOutput: 'a', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'abcdef', expectedOutput: 'fedcba', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'A man a plan', expectedOutput: 'nalp a nam A', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '12345', expectedOutput: '54321', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    getline(cin, s);

    // Write your solution here

    return 0;
}`,
      python: `s = input()

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const s = lines[0]

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 3. FizzBuzz
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz',
    description: `## FizzBuzz

Given an integer \`n\`, print a string representation of the numbers from \`1\` to \`n\` following these rules:

- If the number is divisible by **3**, print \`"Fizz"\`.
- If the number is divisible by **5**, print \`"Buzz"\`.
- If the number is divisible by **both 3 and 5**, print \`"FizzBuzz"\`.
- Otherwise, print the number itself.

### Input Format

- A single integer \`n\`.

### Output Format

- Print \`n\` lines, one for each number from 1 to \`n\`, following the FizzBuzz rules.

### Notes

- This is a classic interview question. Make sure to handle the divisibility by both 3 and 5 before checking individually.`,
    difficulty: 'easy' as const,
    tags: ['math', 'string', 'simulation'],
    constraints: '1 <= n <= 10^4',
    examples: [
      {
        input: '5',
        output: '1\n2\nFizz\n4\nBuzz',
        explanation: '1 and 2 are printed as-is. 3 is divisible by 3 so "Fizz". 4 is printed as-is. 5 is divisible by 5 so "Buzz".',
      },
      {
        input: '15',
        output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        explanation: '15 is divisible by both 3 and 5, so it prints "FizzBuzz".',
      },
    ],
    testCases: [
      { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3', expectedOutput: '1\n2\nFizz', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '30', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz\nFizz\n22\n23\nFizz\nBuzz\n26\nFizz\n28\n29\nFizzBuzz', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2', expectedOutput: '1\n2', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;

    // Write your solution here

    return 0;
}`,
      python: `n = int(input())

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const n = parseInt(lines[0])

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 4. Binary Search
  {
    title: 'Binary Search',
    slug: 'binary-search',
    description: `## Binary Search

Given a **sorted** array of integers \`nums\` in ascending order and an integer \`target\`, write an algorithm to search for \`target\` in \`nums\`. If \`target\` exists, return its index. Otherwise, return \`-1\`.

You must write an algorithm with **O(log n)** runtime complexity.

### Input Format

- The first line contains two space-separated integers \`n\` (the size of the array) and \`target\`.
- The second line contains \`n\` space-separated integers representing the sorted array \`nums\`.

### Output Format

- Print a single integer: the index of \`target\` in \`nums\`, or \`-1\` if it does not exist.

### Notes

- The array is sorted in non-decreasing order.
- All elements in the array are unique.`,
    difficulty: 'easy' as const,
    tags: ['array', 'binary-search'],
    constraints: '1 <= nums.length <= 10^4\n-10^4 <= nums[i], target <= 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.',
    examples: [
      {
        input: '6 9\n-1 0 3 5 9 12',
        output: '4',
        explanation: '9 exists in nums and its index is 4.',
      },
      {
        input: '6 2\n-1 0 3 5 9 12',
        output: '-1',
        explanation: '2 does not exist in nums so return -1.',
      },
    ],
    testCases: [
      { input: '6 9\n-1 0 3 5 9 12', expectedOutput: '4', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '6 2\n-1 0 3 5 9 12', expectedOutput: '-1', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1 5\n5', expectedOutput: '0', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '1 1\n5', expectedOutput: '-1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5 1\n1 2 3 4 5', expectedOutput: '0', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5 5\n1 2 3 4 5', expectedOutput: '4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5 3\n1 2 3 4 5', expectedOutput: '2', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3 0\n-5 0 10', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here

    return 0;
}`,
      python: `n, target = map(int, input().split())
nums = list(map(int, input().split()))

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const [n, target] = lines[0].split(' ').map(Number)
    const nums = lines[1].split(' ').map(Number)

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 5. Valid Parentheses
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    description: `## Valid Parentheses

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:

1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Input Format

- A single line containing the string \`s\`.

### Output Format

- Print \`true\` if the string is valid, \`false\` otherwise.

### Notes

- The string may be empty, which is considered valid.
- The string only contains the six bracket characters mentioned above.`,
    difficulty: 'easy' as const,
    tags: ['string', 'stack'],
    constraints: '0 <= s.length <= 10^4\ns consists of parentheses only: \'()[]{}\' ',
    examples: [
      {
        input: '()',
        output: 'true',
        explanation: 'Single pair of matching parentheses is valid.',
      },
      {
        input: '()[]{}',
        output: 'true',
        explanation: 'Three pairs of matching brackets, all valid.',
      },
      {
        input: '(]',
        output: 'false',
        explanation: 'Opening ( is closed by ] which is a mismatch.',
      },
    ],
    testCases: [
      { input: '()', expectedOutput: 'true', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '()[]{}', expectedOutput: 'true', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '(]', expectedOutput: 'false', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '([)]', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '{[]}', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '((((', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '}{', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '({[()]})', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    getline(cin, s);

    // Write your solution here

    return 0;
}`,
      python: `s = input()

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const s = lines[0] || ''

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 6. Maximum Subarray
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    description: `## Maximum Subarray

Given an integer array \`nums\`, find the **contiguous subarray** (containing at least one number) which has the **largest sum** and return its sum.

A subarray is a contiguous part of an array.

### Input Format

- The first line contains a single integer \`n\` (the size of the array).
- The second line contains \`n\` space-separated integers representing the array \`nums\`.

### Output Format

- Print a single integer: the maximum subarray sum.

### Notes

- The subarray must contain at least one element.
- The optimal solution runs in O(n) time using Kadane's algorithm.
- The array can contain negative numbers.`,
    difficulty: 'medium' as const,
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    examples: [
      {
        input: '9\n-2 1 -3 4 -1 2 1 -5 4',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum = 6.',
      },
      {
        input: '1\n1',
        output: '1',
        explanation: 'The subarray [1] has the largest sum = 1.',
      },
      {
        input: '5\n5 4 -1 7 8',
        output: '23',
        explanation: 'The subarray [5,4,-1,7,8] has the largest sum = 23.',
      },
    ],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1\n1', expectedOutput: '1', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1\n-1', expectedOutput: '-1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5\n-2 -3 -1 -5 -4', expectedOutput: '-1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3\n1 2 3', expectedOutput: '6', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '6\n-1 2 3 -4 5 -3', expectedOutput: '6', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4\n-1 -2 -3 -4', expectedOutput: '-1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here

    return 0;
}`,
      python: `n = int(input())
nums = list(map(int, input().split()))

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const n = parseInt(lines[0])
    const nums = lines[1].split(' ').map(Number)

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 7. Merge Sorted Arrays
  {
    title: 'Merge Sorted Arrays',
    slug: 'merge-sorted-arrays',
    description: `## Merge Sorted Arrays

You are given two integer arrays \`nums1\` and \`nums2\`, both sorted in **non-decreasing order**. Merge the two arrays into a single sorted array and print the result.

### Input Format

- The first line contains an integer \`m\` (the size of the first array).
- The second line contains \`m\` space-separated integers representing \`nums1\`.
- The third line contains an integer \`n\` (the size of the second array).
- The fourth line contains \`n\` space-separated integers representing \`nums2\`.

### Output Format

- Print the merged sorted array as space-separated integers on a single line.

### Notes

- Both arrays are already sorted in non-decreasing order.
- The merged result should also be in non-decreasing order.
- Either array may be empty (size 0). If an array is empty, its line of values will be blank.`,
    difficulty: 'easy' as const,
    tags: ['array', 'two-pointers', 'sorting'],
    constraints: '0 <= m, n <= 200\n-10^9 <= nums1[i], nums2[j] <= 10^9',
    examples: [
      {
        input: '3\n1 2 4\n3\n1 3 5',
        output: '1 1 2 3 4 5',
        explanation: 'Merging [1,2,4] and [1,3,5] gives [1,1,2,3,4,5].',
      },
      {
        input: '3\n1 2 3\n0\n',
        output: '1 2 3',
        explanation: 'Second array is empty, so result is just the first array.',
      },
    ],
    testCases: [
      { input: '3\n1 2 4\n3\n1 3 5', expectedOutput: '1 1 2 3 4 5', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '3\n1 2 3\n0\n', expectedOutput: '1 2 3', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '0\n\n3\n2 5 6', expectedOutput: '2 5 6', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '1\n1\n1\n2', expectedOutput: '1 2', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4\n1 3 5 7\n4\n2 4 6 8', expectedOutput: '1 2 3 4 5 6 7 8', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3\n-3 -1 0\n3\n-2 1 3', expectedOutput: '-3 -2 -1 0 1 3', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2\n5 5\n2\n5 5', expectedOutput: '5 5 5 5', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int m;
    cin >> m;
    vector<int> nums1(m);
    for (int i = 0; i < m; i++) cin >> nums1[i];

    int n;
    cin >> n;
    vector<int> nums2(n);
    for (int i = 0; i < n; i++) cin >> nums2[i];

    // Write your solution here

    return 0;
}`,
      python: `m = int(input())
nums1 = list(map(int, input().split())) if m > 0 else []
n = int(input())
nums2 = list(map(int, input().split())) if n > 0 else []

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const m = parseInt(lines[0])
    const nums1 = m > 0 ? lines[1].split(' ').map(Number) : []
    const n = parseInt(lines[2])
    const nums2 = n > 0 ? lines[3].split(' ').map(Number) : []

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int m = sc.nextInt();
        int[] nums1 = new int[m];
        for (int i = 0; i < m; i++) nums1[i] = sc.nextInt();

        int n = sc.nextInt();
        int[] nums2 = new int[n];
        for (int i = 0; i < n; i++) nums2[i] = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 8. Palindrome Check
  {
    title: 'Palindrome Check',
    slug: 'palindrome-check',
    description: `## Palindrome Check

A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

### Input Format

- A single line containing the string \`s\`.

### Output Format

- Print \`true\` if the string is a palindrome, \`false\` otherwise.

### Notes

- The comparison is case-insensitive.
- Only alphanumeric characters are considered.
- An empty string is considered a valid palindrome.`,
    difficulty: 'easy' as const,
    tags: ['string', 'two-pointers'],
    constraints: '0 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    examples: [
      {
        input: 'A man, a plan, a canal: Panama',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome after cleaning.',
      },
      {
        input: 'race a car',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.',
      },
      {
        input: ' ',
        output: 'true',
        explanation: 'After removing non-alphanumeric characters, s is an empty string "", which reads the same forward and backward.',
      },
    ],
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'race a car', expectedOutput: 'false', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: ' ', expectedOutput: 'true', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'a', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'ab', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'Was it a car or a cat I saw?', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '0P', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '12321', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    getline(cin, s);

    // Write your solution here

    return 0;
}`,
      python: `s = input()

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const s = lines[0] || ''

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 9. Fibonacci
  {
    title: 'Fibonacci',
    slug: 'fibonacci',
    description: `## Fibonacci

The **Fibonacci numbers**, commonly denoted \`F(n)\`, form a sequence called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is:

- \`F(0) = 0\`
- \`F(1) = 1\`
- \`F(n) = F(n - 1) + F(n - 2)\` for \`n > 1\`

Given \`n\`, calculate \`F(n)\`.

### Input Format

- A single integer \`n\`.

### Output Format

- Print a single integer: the value of \`F(n)\`.

### Notes

- Use an iterative approach or memoization to avoid exponential time complexity.
- The answer fits in a 64-bit signed integer for the given constraints.`,
    difficulty: 'easy' as const,
    tags: ['math', 'dynamic-programming', 'recursion', 'memoization'],
    constraints: '0 <= n <= 50',
    examples: [
      {
        input: '2',
        output: '1',
        explanation: 'F(2) = F(1) + F(0) = 1 + 0 = 1.',
      },
      {
        input: '3',
        output: '2',
        explanation: 'F(3) = F(2) + F(1) = 1 + 1 = 2.',
      },
      {
        input: '10',
        output: '55',
        explanation: 'F(10) = 55. The sequence up to 10 is: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55.',
      },
    ],
    testCases: [
      { input: '2', expectedOutput: '1', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '3', expectedOutput: '2', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '10', expectedOutput: '55', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '0', expectedOutput: '0', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '1', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '20', expectedOutput: '6765', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '30', expectedOutput: '832040', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '50', expectedOutput: '12586269025', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;

    // Write your solution here

    return 0;
}`,
      python: `n = int(input())

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const n = parseInt(lines[0])

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 10. Longest Substring Without Repeating Characters
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    description: `## Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the **longest substring** without repeating characters.

A **substring** is a contiguous non-empty sequence of characters within a string.

### Input Format

- A single line containing the string \`s\`.

### Output Format

- Print a single integer: the length of the longest substring without repeating characters.

### Notes

- If the string is empty, the answer is 0.
- Use the sliding window technique for an O(n) solution.
- The string may contain letters, digits, symbols, and spaces.`,
    difficulty: 'medium' as const,
    tags: ['string', 'hash-table', 'sliding-window'],
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    examples: [
      {
        input: 'abcabcbb',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 'bbbbb',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 'pwwkew',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3. Note that "pwke" is a subsequence, not a substring.',
      },
    ],
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'bbbbb', expectedOutput: '1', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'pwwkew', expectedOutput: '3', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '', expectedOutput: '0', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'a', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'abcdefg', expectedOutput: '7', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'dvdf', expectedOutput: '3', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'anviaj', expectedOutput: '5', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'aab', expectedOutput: '2', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    getline(cin, s);

    // Write your solution here

    return 0;
}`,
      python: `s = input()

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const s = lines[0] || ''

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 11. Container With Most Water
  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    description: `## Container With Most Water

You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the **most water**.

Return the maximum amount of water a container can store.

**Notice:** You may not slant the container.

### Input Format

- The first line contains a single integer \`n\` (the number of lines).
- The second line contains \`n\` space-separated integers representing the \`height\` array.

### Output Format

- Print a single integer: the maximum area of water the container can hold.

### Notes

- The area is calculated as \`min(height[i], height[j]) * (j - i)\`.
- Use the two-pointer technique for an O(n) solution.`,
    difficulty: 'medium' as const,
    tags: ['array', 'two-pointers', 'greedy'],
    constraints: '2 <= n <= 10^5\n0 <= height[i] <= 10^4',
    examples: [
      {
        input: '9\n1 8 6 2 5 4 8 3 7',
        output: '49',
        explanation: 'The max area is between lines at index 1 (height 8) and index 8 (height 7): min(8,7) * (8-1) = 49.',
      },
      {
        input: '2\n1 1',
        output: '1',
        explanation: 'The max area is min(1,1) * (1-0) = 1.',
      },
    ],
    testCases: [
      { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '2\n1 1', expectedOutput: '1', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '3\n4 3 2', expectedOutput: '4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4\n1 2 4 3', expectedOutput: '4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5\n1 1 1 1 1', expectedOutput: '4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '6\n2 3 4 5 18 17', expectedOutput: '17', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2\n1 10000', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> height(n);
    for (int i = 0; i < n; i++) cin >> height[i];

    // Write your solution here

    return 0;
}`,
      python: `n = int(input())
height = list(map(int, input().split()))

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const n = parseInt(lines[0])
    const height = lines[1].split(' ').map(Number)

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] height = new int[n];
        for (int i = 0; i < n; i++) height[i] = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 12. Roman to Integer
  {
    title: 'Roman to Integer',
    slug: 'roman-to-integer',
    description: `## Roman to Integer

Roman numerals are represented by seven different symbols:

| Symbol | Value |
|--------|-------|
| I      | 1     |
| V      | 5     |
| X      | 10    |
| L      | 50    |
| C      | 100   |
| D      | 500   |
| M      | 1000  |

For example, \`2\` is written as \`II\`, and \`12\` is written as \`XII\` (\`X + II\`). The number \`27\` is written as \`XXVII\` (\`XX + V + II\`).

Roman numerals are usually written largest to smallest from left to right. However, there are six instances where subtraction is used:

- \`I\` before \`V\` (5) and \`X\` (10) makes 4 and 9.
- \`X\` before \`L\` (50) and \`C\` (100) makes 40 and 90.
- \`C\` before \`D\` (500) and \`M\` (1000) makes 400 and 900.

Given a roman numeral string, convert it to an integer.

### Input Format

- A single line containing the roman numeral string \`s\`.

### Output Format

- Print a single integer: the integer value of the roman numeral.`,
    difficulty: 'easy' as const,
    tags: ['string', 'hash-table', 'math'],
    constraints: '1 <= s.length <= 15\ns contains only the characters (I, V, X, L, C, D, M).\nIt is guaranteed that s is a valid roman numeral in the range [1, 3999].',
    examples: [
      {
        input: 'III',
        output: '3',
        explanation: 'III = 3.',
      },
      {
        input: 'LVIII',
        output: '58',
        explanation: 'L = 50, V = 5, III = 3. Total = 58.',
      },
      {
        input: 'MCMXCIV',
        output: '1994',
        explanation: 'M = 1000, CM = 900, XC = 90, IV = 4. Total = 1994.',
      },
    ],
    testCases: [
      { input: 'III', expectedOutput: '3', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'LVIII', expectedOutput: '58', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'MCMXCIV', expectedOutput: '1994', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'IV', expectedOutput: '4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'IX', expectedOutput: '9', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'XLII', expectedOutput: '42', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'CDXLIV', expectedOutput: '444', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'MMMCMXCIX', expectedOutput: '3999', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'I', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;

    // Write your solution here

    return 0;
}`,
      python: `s = input()

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const s = lines[0]

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 13. Valid Anagram
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    description: `## Valid Anagram

Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an **anagram** of \`s\`, and \`false\` otherwise.

An **anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

### Input Format

- The first line contains the string \`s\`.
- The second line contains the string \`t\`.

### Output Format

- Print \`true\` if \`t\` is an anagram of \`s\`, \`false\` otherwise.

### Notes

- Both strings consist only of lowercase English letters.
- Two strings are anagrams if and only if they contain the same characters with the same frequencies.`,
    difficulty: 'easy' as const,
    tags: ['string', 'hash-table', 'sorting'],
    constraints: '1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.',
    examples: [
      {
        input: 'anagram\nnagaram',
        output: 'true',
        explanation: '"nagaram" is a rearrangement of "anagram".',
      },
      {
        input: 'rat\ncar',
        output: 'false',
        explanation: '"car" is not a rearrangement of "rat".',
      },
    ],
    testCases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'rat\ncar', expectedOutput: 'false', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: 'a\na', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'a\nab', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'listen\nsilent', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'hello\nworld', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'abcdefg\ngfedcba', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: 'aabb\nbbaa', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s, t;
    getline(cin, s);
    getline(cin, t);

    // Write your solution here

    return 0;
}`,
      python: `s = input()
t = input()

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const s = lines[0]
    const t = lines[1]

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        String t = sc.nextLine();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 14. Group Anagrams
  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    description: `## Group Anagrams

Given an array of strings \`strs\`, group the **anagrams** together. You can return the answer in **any order**.

An **anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.

### Input Format

- The first line contains an integer \`n\` (the number of strings).
- The second line contains \`n\` space-separated strings.

### Output Format

- Print each group of anagrams on a separate line, with words space-separated.
- Within each group, words should be in the order they appeared in the input.
- Groups should be sorted by the first occurrence of any member in the input.

### Notes

- All strings consist of lowercase English letters.
- The empty string \`""\` is considered valid.`,
    difficulty: 'medium' as const,
    tags: ['string', 'hash-table', 'sorting'],
    constraints: '1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100\nstrs[i] consists of lowercase English letters.',
    examples: [
      {
        input: '6\neat tea tan ate nat bat',
        output: 'eat tea ate\ntan nat\nbat',
        explanation: '"eat", "tea", "ate" are anagrams. "tan", "nat" are anagrams. "bat" has no anagram in the list.',
      },
      {
        input: '1\na',
        output: 'a',
        explanation: 'Single string forms its own group.',
      },
    ],
    testCases: [
      { input: '6\neat tea tan ate nat bat', expectedOutput: 'eat tea ate\ntan nat\nbat', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1\na', expectedOutput: 'a', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '3\nabc bca cab', expectedOutput: 'abc bca cab', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4\nlisten silent hello world', expectedOutput: 'listen silent\nhello\nworld', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2\nab ba', expectedOutput: 'ab ba', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5\ndog god cat tac act', expectedOutput: 'dog god\ncat tac act', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3\naaa aaa aaa', expectedOutput: 'aaa aaa aaa', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<string> strs(n);
    for (int i = 0; i < n; i++) cin >> strs[i];

    // Write your solution here

    return 0;
}`,
      python: `n = int(input())
strs = input().split()

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const n = parseInt(lines[0])
    const strs = lines[1].split(' ')

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        String[] strs = new String[n];
        for (int i = 0; i < n; i++) strs[i] = sc.next();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 15. Climbing Stairs
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    description: `## Climbing Stairs

You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb **1** or **2** steps. In how many distinct ways can you climb to the top?

### Input Format

- A single integer \`n\` representing the number of steps.

### Output Format

- Print a single integer: the number of distinct ways to climb to the top.

### Notes

- This problem follows the Fibonacci pattern: \`ways(n) = ways(n-1) + ways(n-2)\`.
- Use dynamic programming or iteration to avoid exponential time complexity.
- \`ways(1) = 1\`, \`ways(2) = 2\`.`,
    difficulty: 'easy' as const,
    tags: ['math', 'dynamic-programming', 'memoization'],
    constraints: '1 <= n <= 45',
    examples: [
      {
        input: '2',
        output: '2',
        explanation: 'There are two ways: (1+1) or (2).',
      },
      {
        input: '3',
        output: '3',
        explanation: 'There are three ways: (1+1+1), (1+2), or (2+1).',
      },
    ],
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '3', expectedOutput: '3', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4', expectedOutput: '5', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5', expectedOutput: '8', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '10', expectedOutput: '89', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '20', expectedOutput: '10946', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '45', expectedOutput: '1836311903', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;

    // Write your solution here

    return 0;
}`,
      python: `n = int(input())

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const n = parseInt(lines[0])

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 16. Best Time to Buy and Sell Stock
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    description: `## Best Time to Buy and Sell Stock

You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the **maximum profit** you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.

### Input Format

- The first line contains a single integer \`n\` (the number of days).
- The second line contains \`n\` space-separated integers representing the stock prices.

### Output Format

- Print a single integer: the maximum profit, or \`0\` if no profit is possible.

### Notes

- You must buy before you sell (you cannot sell on a day before or equal to the buy day).
- You may complete at most one transaction.
- Track the minimum price seen so far and the maximum profit at each step.`,
    difficulty: 'easy' as const,
    tags: ['array', 'dynamic-programming', 'greedy'],
    constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4',
    examples: [
      {
        input: '6\n7 1 5 3 6 4',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.',
      },
      {
        input: '5\n7 6 4 3 1',
        output: '0',
        explanation: 'Prices only go down, no profitable transaction is possible.',
      },
    ],
    testCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '5\n7 6 4 3 1', expectedOutput: '0', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1\n5', expectedOutput: '0', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2\n1 2', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2\n2 1', expectedOutput: '0', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5\n2 4 1 3 5', expectedOutput: '4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4\n3 3 3 3', expectedOutput: '0', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '6\n1 2 3 4 5 6', expectedOutput: '5', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> prices(n);
    for (int i = 0; i < n; i++) cin >> prices[i];

    // Write your solution here

    return 0;
}`,
      python: `n = int(input())
prices = list(map(int, input().split()))

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const n = parseInt(lines[0])
    const prices = lines[1].split(' ').map(Number)

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] prices = new int[n];
        for (int i = 0; i < n; i++) prices[i] = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 17. Coin Change
  {
    title: 'Coin Change',
    slug: 'coin-change',
    description: `## Coin Change

You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an **infinite number** of each kind of coin.

### Input Format

- The first line contains two space-separated integers \`n\` (the number of coin types) and \`amount\`.
- The second line contains \`n\` space-separated integers representing the coin denominations.

### Output Format

- Print a single integer: the minimum number of coins needed, or \`-1\` if impossible.

### Notes

- This is a classic dynamic programming problem.
- Build a DP array where \`dp[i]\` represents the minimum coins needed for amount \`i\`.
- Initialize \`dp[0] = 0\` and all others to infinity.`,
    difficulty: 'medium' as const,
    tags: ['array', 'dynamic-programming', 'breadth-first-search'],
    constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
    examples: [
      {
        input: '3 11\n1 5 2',
        output: '3',
        explanation: '11 = 5 + 5 + 1. Three coins needed.',
      },
      {
        input: '1 3\n2',
        output: '-1',
        explanation: 'Amount 3 cannot be made with only coins of denomination 2.',
      },
      {
        input: '1 0\n1',
        output: '0',
        explanation: 'Amount 0 requires 0 coins.',
      },
    ],
    testCases: [
      { input: '3 11\n1 5 2', expectedOutput: '3', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1 3\n2', expectedOutput: '-1', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1 0\n1', expectedOutput: '0', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '3 6\n1 2 5', expectedOutput: '2', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3 100\n1 5 10', expectedOutput: '10', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2 7\n2 3', expectedOutput: '3', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4 15\n1 5 10 25', expectedOutput: '2', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '1 1\n1', expectedOutput: '1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '1 2\n3', expectedOutput: '-1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, amount;
    cin >> n >> amount;
    vector<int> coins(n);
    for (int i = 0; i < n; i++) cin >> coins[i];

    // Write your solution here

    return 0;
}`,
      python: `n, amount = map(int, input().split())
coins = list(map(int, input().split()))

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const [n, amount] = lines[0].split(' ').map(Number)
    const coins = lines[1].split(' ').map(Number)

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int amount = sc.nextInt();
        int[] coins = new int[n];
        for (int i = 0; i < n; i++) coins[i] = sc.nextInt();

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 18. LRU Cache
  {
    title: 'LRU Cache',
    slug: 'lru-cache',
    description: `## LRU Cache

Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the LRU cache with the following operations:

- \`PUT key value\` — Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the \`capacity\`, evict the least recently used key.
- \`GET key\` — Return the value of the key if the key exists, otherwise return \`-1\`.

Both \`GET\` and \`PUT\` must run in **O(1)** average time complexity.

### Input Format

- The first line contains two integers \`capacity\` and \`q\` (number of operations).
- The next \`q\` lines each contain an operation:
  - \`PUT key value\` (two integers after PUT)
  - \`GET key\` (one integer after GET)

### Output Format

- For each \`GET\` operation, print the result on a separate line.
- \`PUT\` operations produce no output.

### Notes

- Use a hash map combined with a doubly linked list for O(1) operations.
- Most languages have a built-in ordered dictionary or linked hash map that can be used.
- When capacity is exceeded, remove the least recently used item before inserting the new one.`,
    difficulty: 'hard' as const,
    tags: ['hash-table', 'linked-list', 'design'],
    constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 operations total.',
    examples: [
      {
        input: '2 9\nPUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2\nPUT 4 4\nGET 1\nGET 3\nGET 4',
        output: '1\n-1\n-1\n3\n4',
        explanation: 'Cache capacity is 2. After PUT 1,1 and PUT 2,2 the cache is {1=1, 2=2}. GET 1 returns 1 and moves key 1 to most recent. PUT 3,3 evicts key 2 (least recent). GET 2 returns -1 (evicted). PUT 4,4 evicts key 1. GET 1 returns -1, GET 3 returns 3, GET 4 returns 4.',
      },
    ],
    testCases: [
      {
        input: '2 9\nPUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2\nPUT 4 4\nGET 1\nGET 3\nGET 4',
        expectedOutput: '1\n-1\n-1\n3\n4',
        isHidden: false,
        timeLimit: 2000,
        memoryLimit: 256,
      },
      {
        input: '1 5\nPUT 1 10\nGET 1\nPUT 2 20\nGET 1\nGET 2',
        expectedOutput: '10\n-1\n20',
        isHidden: false,
        timeLimit: 2000,
        memoryLimit: 256,
      },
      {
        input: '2 6\nGET 1\nPUT 1 1\nPUT 2 2\nPUT 3 3\nGET 1\nGET 3',
        expectedOutput: '-1\n-1\n3',
        isHidden: true,
        timeLimit: 2000,
        memoryLimit: 256,
      },
      {
        input: '2 7\nPUT 1 1\nPUT 2 2\nGET 1\nGET 2\nPUT 3 3\nGET 1\nGET 3',
        expectedOutput: '1\n2\n-1\n3',
        isHidden: true,
        timeLimit: 2000,
        memoryLimit: 256,
      },
      {
        input: '3 9\nPUT 1 10\nPUT 2 20\nPUT 3 30\nGET 2\nPUT 4 40\nGET 1\nGET 2\nGET 3\nGET 4',
        expectedOutput: '20\n-1\n20\n30\n40',
        isHidden: true,
        timeLimit: 2000,
        memoryLimit: 256,
      },
      {
        input: '2 4\nPUT 1 1\nPUT 1 2\nGET 1\nGET 2',
        expectedOutput: '2\n-1',
        isHidden: true,
        timeLimit: 2000,
        memoryLimit: 256,
      },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int capacity, q;
    cin >> capacity >> q;

    // Write your solution here
    // Implement an LRU Cache with the given capacity
    // Process q operations: PUT key value / GET key

    return 0;
}`,
      python: `capacity, q = map(int, input().split())

# Write your solution here
# Implement an LRU Cache with the given capacity
# Process q operations: PUT key value / GET key

for _ in range(q):
    op = input().split()
    pass
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const [capacity, q] = lines[0].split(' ').map(Number)

    // Write your solution here
    // Implement an LRU Cache with the given capacity
    // Process q operations: PUT key value / GET key

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int capacity = sc.nextInt();
        int q = sc.nextInt();

        // Write your solution here
        // Implement an LRU Cache with the given capacity
        // Process q operations: PUT key value / GET key

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 19. Linked List Cycle Detection
  {
    title: 'Linked List Cycle Detection',
    slug: 'linked-list-cycle-detection',
    description: `## Linked List Cycle Detection

Given a linked list represented as an array of node values, and an integer \`pos\` which denotes the index (0-based) of the node that the tail connects to, determine if the linked list has a **cycle**.

If \`pos\` is \`-1\`, then there is no cycle.

### Input Format

- The first line contains two integers \`n\` (number of nodes) and \`pos\` (the index the tail connects to, or -1 for no cycle).
- The second line contains \`n\` space-separated integers representing the node values.

### Output Format

- Print \`true\` if there is a cycle, \`false\` otherwise.

### Notes

- In a real implementation, you would use Floyd's Cycle Detection algorithm (tortoise and hare) for O(1) space.
- For this problem, since we provide the cycle information as input, you need to simulate the linked list and detect the cycle.
- \`pos\` is not given as a parameter in real interviews — you detect it using two pointers. Here it is provided for constructing the list.`,
    difficulty: 'medium' as const,
    tags: ['linked-list', 'two-pointers', 'hash-table'],
    constraints: '0 <= n <= 10^4\n-10^5 <= Node.val <= 10^5\npos is -1 or a valid index in the linked list.',
    examples: [
      {
        input: '4 1\n3 2 0 -4',
        output: 'true',
        explanation: 'There is a cycle: the tail connects to node at index 1 (value 2).',
      },
      {
        input: '2 0\n1 2',
        output: 'true',
        explanation: 'The tail connects back to node at index 0 (value 1).',
      },
      {
        input: '1 -1\n1',
        output: 'false',
        explanation: 'There is no cycle. pos = -1 means the tail points to null.',
      },
    ],
    testCases: [
      { input: '4 1\n3 2 0 -4', expectedOutput: 'true', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '2 0\n1 2', expectedOutput: 'true', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1 -1\n1', expectedOutput: 'false', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '0 -1\n', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3 -1\n1 2 3', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5 4\n1 2 3 4 5', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3 2\n10 20 30', expectedOutput: 'true', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '6 -1\n1 2 3 4 5 6', expectedOutput: 'false', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, pos;
    cin >> n >> pos;
    vector<int> values(n);
    for (int i = 0; i < n; i++) cin >> values[i];

    // Write your solution here
    // Determine if the linked list has a cycle based on pos
    // pos is the index the tail connects to (-1 means no cycle)

    return 0;
}`,
      python: `n, pos = map(int, input().split())
values = list(map(int, input().split())) if n > 0 else []

# Write your solution here
# Determine if the linked list has a cycle based on pos
# pos is the index the tail connects to (-1 means no cycle)
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const [n, pos] = lines[0].split(' ').map(Number)
    const values = n > 0 ? lines[1].split(' ').map(Number) : []

    // Write your solution here
    // Determine if the linked list has a cycle based on pos
    // pos is the index the tail connects to (-1 means no cycle)

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int pos = sc.nextInt();
        int[] values = new int[n];
        for (int i = 0; i < n; i++) values[i] = sc.nextInt();

        // Write your solution here
        // Determine if the linked list has a cycle based on pos
        // pos is the index the tail connects to (-1 means no cycle)

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },

  // 20. Merge Intervals
  {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    description: `## Merge Intervals

Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

Two intervals \`[a, b]\` and \`[c, d]\` overlap if \`c <= b\` (assuming \`a <= c\` after sorting).

### Input Format

- The first line contains a single integer \`n\` (the number of intervals).
- The next \`n\` lines each contain two space-separated integers \`start\` and \`end\` representing an interval.

### Output Format

- Print each merged interval on a separate line as two space-separated integers \`start end\`.
- Intervals should be printed in ascending order of their start values.

### Notes

- Sort the intervals by their start value first.
- Then iterate and merge overlapping intervals.
- Two intervals overlap if the start of the second is less than or equal to the end of the first.`,
    difficulty: 'medium' as const,
    tags: ['array', 'sorting'],
    constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start_i <= end_i <= 10^4',
    examples: [
      {
        input: '4\n1 3\n2 6\n8 10\n15 18',
        output: '1 6\n8 10\n15 18',
        explanation: 'Intervals [1,3] and [2,6] overlap, so they are merged into [1,6]. The rest do not overlap.',
      },
      {
        input: '2\n1 4\n4 5',
        output: '1 5',
        explanation: 'Intervals [1,4] and [4,5] overlap (they share the boundary 4), merged into [1,5].',
      },
    ],
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5', isHidden: false, timeLimit: 2000, memoryLimit: 256 },
      { input: '1\n1 1', expectedOutput: '1 1', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3\n1 10\n2 3\n4 5', expectedOutput: '1 10', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '3\n1 2\n3 4\n5 6', expectedOutput: '1 2\n3 4\n5 6', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '5\n1 4\n0 4\n3 5\n7 9\n8 10', expectedOutput: '0 5\n7 10', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '2\n1 4\n2 3', expectedOutput: '1 4', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      { input: '4\n1 3\n5 7\n2 4\n6 8', expectedOutput: '1 4\n5 8', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<pair<int,int>> intervals(n);
    for (int i = 0; i < n; i++) cin >> intervals[i].first >> intervals[i].second;

    // Write your solution here

    return 0;
}`,
      python: `n = int(input())
intervals = []
for _ in range(n):
    a, b = map(int, input().split())
    intervals.append([a, b])

# Write your solution here
`,
      javascript: `const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin })
const lines = []
rl.on('line', (line) => lines.push(line))
rl.on('close', () => {
    const n = parseInt(lines[0])
    const intervals = []
    for (let i = 1; i <= n; i++) {
        const [start, end] = lines[i].split(' ').map(Number)
        intervals.push([start, end])
    }

    // Write your solution here

})`,
      java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] intervals = new int[n][2];
        for (int i = 0; i < n; i++) {
            intervals[i][0] = sc.nextInt();
            intervals[i][1] = sc.nextInt();
        }

        // Write your solution here

    }
}`,
    },
    metadata: { timesUsed: 0, avgSolveTime: 0, solveRate: 0 },
  },
]

const seed = async () => {
  await mongoose.connect(env.mongodbUri)
  console.log('Connected to MongoDB')

  await Problem.deleteMany({})
  console.log('Cleared existing problems')

  await Problem.insertMany(problems)
  console.log(`Seeded ${problems.length} problems`)

  await mongoose.disconnect()
  console.log('Done!')
}

seed().catch(console.error)
