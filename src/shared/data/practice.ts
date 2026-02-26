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
  starter: string;
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
    starter: "function twoSum(nums, target) {\n  // TODO\n}\n\nconsole.log(twoSum([2,7,11,15], 9));"
  },
  {
    id: "c2",
    title: "Valid Parentheses",
    description: "Return true if the input string has valid parentheses ordering.",
    starter: "function isValid(s) {\n  // TODO\n}\n\nconsole.log(isValid('()[]{}'));"
  },
  {
    id: "c3",
    title: "Binary Search",
    description: "Implement binary search and return the index of target or -1.",
    starter: "function binarySearch(arr, target) {\n  // TODO\n}\n\nconsole.log(binarySearch([1,3,5,7,9], 7));"
  }
];
