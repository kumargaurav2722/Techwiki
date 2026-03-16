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
  },
  {
    id: "q4",
    question: "What is the time complexity of merge sort?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    answerIndex: 1,
    explanation: "Merge sort divides the array in half recursively and merges in O(n), giving O(n log n) overall."
  },
  {
    id: "q5",
    question: "What is a deadlock?",
    options: [
      "A process that crashes due to memory overflow",
      "Two or more processes waiting indefinitely for each other's resources",
      "A race condition in single-threaded code",
      "A network timeout error"
    ],
    answerIndex: 1,
    explanation: "A deadlock occurs when two or more processes hold resources and wait for each other, causing indefinite blocking."
  },
  {
    id: "q6",
    question: "Which of the following is NOT a SOLID principle?",
    options: [
      "Single Responsibility",
      "Open/Closed",
      "Lazy Initialization",
      "Dependency Inversion"
    ],
    answerIndex: 2,
    explanation: "SOLID stands for Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion."
  },
  {
    id: "q7",
    question: "What does a B-Tree index optimize in databases?",
    options: [
      "In-memory caching",
      "Range queries and ordered access",
      "Hash-based lookups only",
      "Write-heavy workloads exclusively"
    ],
    answerIndex: 1,
    explanation: "B-Trees maintain sorted data and allow efficient range queries, ordered traversal, and logarithmic lookups."
  },
  {
    id: "q8",
    question: "In REST, which HTTP method is idempotent?",
    options: ["POST", "PUT", "PATCH (always)", "None of them"],
    answerIndex: 1,
    explanation: "PUT is idempotent — making the same PUT request multiple times produces the same result."
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
  },
  {
    id: "sd4",
    title: "Design a Rate Limiter",
    prompt: "Design a distributed rate limiter for an API gateway. Cover algorithms, storage, and fault tolerance.",
    followUps: [
      "Token bucket vs sliding window — when to choose which?",
      "How do you handle rate limiting across multiple data centers?",
      "How do you communicate rate limits to clients?"
    ]
  },
  {
    id: "sd5",
    title: "Design a Distributed Cache",
    prompt: "Design a distributed caching system like Memcached or Redis cluster. Cover consistency, eviction, and replication.",
    followUps: [
      "How do you handle cache stampede?",
      "What consistency model would you use?",
      "How do you handle node failures?"
    ]
  },
  {
    id: "sd6",
    title: "Design a Notification System",
    prompt: "Design a multi-channel notification system supporting push, email, SMS, and in-app notifications at scale.",
    followUps: [
      "How do you prevent notification fatigue?",
      "How do you handle delivery guarantees?",
      "How do you support user preferences?"
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
      cpp:
        "#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // TODO\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2,7,11,15};\n    auto res = twoSum(nums, 9);\n    for (int i : res) cout << i << \" \";\n    cout << endl;\n    return 0;\n}",
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
      cpp:
        "#include <iostream>\n#include <stack>\n#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    // TODO\n    return false;\n}\n\nint main() {\n    cout << boolalpha << isValid(\"()[]{}\") << endl;\n    return 0;\n}",
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
      cpp:
        "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint binarySearch(vector<int>& arr, int target) {\n    // TODO\n    return -1;\n}\n\nint main() {\n    vector<int> arr = {1,3,5,7,9};\n    cout << binarySearch(arr, 7) << endl;\n    return 0;\n}",
    }
  },
  {
    id: "c4",
    title: "Reverse a Linked List",
    description: "Reverse a singly linked list and return the new head. Print the resulting list.",
    defaultLanguage: "javascript",
    starters: {
      javascript:
        "class ListNode {\n  constructor(val, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\n\nfunction reverseList(head) {\n  // TODO\n}\n\n// Build: 1 -> 2 -> 3\nlet head = new ListNode(1, new ListNode(2, new ListNode(3)));\nhead = reverseList(head);\nlet out = [];\nwhile (head) { out.push(head.val); head = head.next; }\nconsole.log(out.join(' -> '));",
      python:
        "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    # TODO\n    return head\n\nhead = ListNode(1, ListNode(2, ListNode(3)))\nhead = reverse_list(head)\nresult = []\nwhile head:\n    result.append(str(head.val))\n    head = head.next\nprint(' -> '.join(result))",
      java:
        "public class Main {\n  static class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int v, ListNode n) { val = v; next = n; }\n  }\n\n  public static ListNode reverseList(ListNode head) {\n    // TODO\n    return head;\n  }\n\n  public static void main(String[] args) {\n    ListNode h = new ListNode(1, new ListNode(2, new ListNode(3, null)));\n    h = reverseList(h);\n    while (h != null) { System.out.print(h.val + (h.next != null ? \" -> \" : \"\")); h = h.next; }\n    System.out.println();\n  }\n}",
      cpp:
        "#include <iostream>\nusing namespace std;\n\nstruct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int v, ListNode* n = nullptr) : val(v), next(n) {}\n};\n\nListNode* reverseList(ListNode* head) {\n    // TODO\n    return head;\n}\n\nint main() {\n    ListNode* h = new ListNode(1, new ListNode(2, new ListNode(3)));\n    h = reverseList(h);\n    while (h) { cout << h->val << (h->next ? \" -> \" : \"\"); h = h->next; }\n    cout << endl;\n    return 0;\n}",
    }
  },
  {
    id: "c5",
    title: "Maximum Subarray (Kadane's)",
    description: "Find the contiguous subarray with the largest sum. Return the max sum.",
    defaultLanguage: "javascript",
    starters: {
      javascript:
        "function maxSubArray(nums) {\n  // TODO: Kadane's algorithm\n}\n\nconsole.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));",
      python:
        "def max_sub_array(nums):\n    # TODO: Kadane's algorithm\n    return 0\n\nprint(max_sub_array([-2,1,-3,4,-1,2,1,-5,4]))",
      java:
        "public class Main {\n  public static int maxSubArray(int[] nums) {\n    // TODO: Kadane's algorithm\n    return 0;\n  }\n\n  public static void main(String[] args) {\n    System.out.println(maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4}));\n  }\n}",
      cpp:
        "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint maxSubArray(vector<int>& nums) {\n    // TODO: Kadane's algorithm\n    return 0;\n}\n\nint main() {\n    vector<int> nums = {-2,1,-3,4,-1,2,1,-5,4};\n    cout << maxSubArray(nums) << endl;\n    return 0;\n}",
    }
  }
];
