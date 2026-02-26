export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type SystemDesignPrompt = {
  id: string;
  title: string;
  prompt: string;
  followUps: string[];
};

export type CodingPrompt = {
  id: string;
  title: string;
  description: string;
  starters: Record<string, string>;
  defaultLanguage?: string;
  sampleInput?: string;
  sampleOutput?: string;
};

export const QUIZZES: QuizQuestion[] = [
  {
    id: "q1",
    question: "What does CAP theorem state about distributed systems?",
    options: [
      "Consistency, Availability, Partition tolerance cannot all be guaranteed",
      "Caching always improves consistency",
      "Availability implies linearizability",
      "Partition tolerance is optional"
    ],
    answerIndex: 0,
    explanation: "CAP says you can only fully guarantee two of the three (C, A, P) at a time."
  },
  {
    id: "q2",
    question: "Which data structure gives average O(1) lookup?",
    options: ["Binary search tree", "Hash table", "Heap", "Trie"],
    answerIndex: 1,
    explanation: "Hash tables provide average O(1) lookup with good hashing."
  },
  {
    id: "q3",
    question: "What is the primary goal of load balancing?",
    options: [
      "Reduce CPU clock speed",
      "Distribute traffic across resources",
      "Increase memory usage",
      "Serialize requests"
    ],
    answerIndex: 1,
    explanation: "Load balancing spreads traffic to improve throughput and reliability."
  }
];

export const SYSTEM_DESIGN_PROMPTS: SystemDesignPrompt[] = [
  {
    id: "sd1",
    title: "Design a URL Shortener",
    prompt: "Design a URL shortener like bit.ly. Discuss APIs, storage, scaling, and reliability.",
    followUps: [
      "How would you handle custom aliases?",
      "How do you avoid hot keys?",
      "How would you support analytics?"
    ]
  },
  {
    id: "sd2",
    title: "Design a Real-time Chat System",
    prompt: "Design a global chat system with presence, message history, and file uploads.",
    followUps: [
      "How do you handle offline delivery?",
      "How would you partition data?",
      "How would you prevent spam?"
    ]
  },
  {
    id: "sd3",
    title: "Design a Recommendation Feed",
    prompt: "Design a personalized feed for a social platform.",
    followUps: [
      "How do you handle ranking?",
      "What happens under traffic spikes?",
      "How do you measure relevance?"
    ]
  }
];

export const CODING_PROMPTS: CodingPrompt[] = [
  {
    id: "c1",
    title: "Two Sum",
    description: "Given an array of integers and a target, return indices of two numbers that add up to the target.",
    defaultLanguage: "javascript",
    starters: {
      javascript:
        "function twoSum(nums, target) {\n  // TODO\n}\n\nconsole.log(twoSum([2,7,11,15], 9));",
      python:
        "def two_sum(nums, target):\n    # TODO\n    return []\n\nprint(two_sum([2,7,11,15], 9))",
      java:
        "import java.util.*;\n\npublic class Main {\n  public static int[] twoSum(int[] nums, int target) {\n    // TODO\n    return new int[0];\n  }\n\n  public static void main(String[] args) {\n    int[] res = twoSum(new int[]{2,7,11,15}, 9);\n    System.out.println(Arrays.toString(res));\n  }\n}",
    }
  },
  {
    id: "c2",
    title: "Valid Parentheses",
    description: "Return true if the input string has valid parentheses ordering.",
    defaultLanguage: "javascript",
    starters: {
      javascript:
        "function isValid(s) {\n  // TODO\n}\n\nconsole.log(isValid('()[]{}'));",
      python:
        "def is_valid(s):\n    # TODO\n    return False\n\nprint(is_valid('()[]{}'))",
      java:
        "import java.util.*;\n\npublic class Main {\n  public static boolean isValid(String s) {\n    // TODO\n    return false;\n  }\n\n  public static void main(String[] args) {\n    System.out.println(isValid(\"()[]{}\"));\n  }\n}",
    }
  },
  {
    id: "c3",
    title: "Binary Search",
    description: "Implement binary search and return the index of target or -1.",
    defaultLanguage: "javascript",
    starters: {
      javascript:
        "function binarySearch(arr, target) {\n  // TODO\n}\n\nconsole.log(binarySearch([1,3,5,7,9], 7));",
      python:
        "def binary_search(arr, target):\n    # TODO\n    return -1\n\nprint(binary_search([1,3,5,7,9], 7))",
      java:
        "public class Main {\n  public static int binarySearch(int[] arr, int target) {\n    // TODO\n    return -1;\n  }\n\n  public static void main(String[] args) {\n    System.out.println(binarySearch(new int[]{1,3,5,7,9}, 7));\n  }\n}",
    }
  }
];
