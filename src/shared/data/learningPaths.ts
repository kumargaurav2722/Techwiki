export type LearningStep = {
  title: string;
  category: string;
};

export type LearningPath = {
  id: string;
  name: string;
  description: string;
  steps: LearningStep[];
};

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "dsa-core",
    name: "DSA Core",
    description: "Master data structures and algorithms with interview-ready depth.",
    steps: [
      { title: "Arrays", category: "dsa" },
      { title: "Linked Lists", category: "dsa" },
      { title: "Stacks and Queues", category: "dsa" },
      { title: "Hash Tables", category: "dsa" },
      { title: "Trees", category: "dsa" },
      { title: "Heaps", category: "dsa" },
      { title: "Graphs", category: "dsa" },
      { title: "Dynamic Programming", category: "dsa" },
      { title: "Greedy Algorithms", category: "dsa" },
      { title: "Sorting Algorithms", category: "dsa" }
    ]
  },
  {
    id: "system-design",
    name: "System Design",
    description: "Industry-grade system design for interviews and real production systems.",
    steps: [
      { title: "Load Balancing", category: "system-design" },
      { title: "Caching", category: "system-design" },
      { title: "Consistent Hashing", category: "system-design" },
      { title: "CAP Theorem", category: "system-design" },
      { title: "Database Sharding", category: "system-design" },
      { title: "Message Queues", category: "system-design" },
      { title: "Event-Driven Architecture", category: "system-design" },
      { title: "Observability", category: "system-design" }
    ]
  },
  {
    id: "backend",
    name: "Backend Fundamentals",
    description: "APIs, databases, performance, and security essentials.",
    steps: [
      { title: "REST APIs", category: "backend" },
      { title: "Authentication", category: "backend" },
      { title: "SQL Basics", category: "dbms" },
      { title: "Indexing", category: "dbms" },
      { title: "Transactions", category: "dbms" },
      { title: "Node.js", category: "backend" },
      { title: "Express", category: "backend" }
    ]
  },
  {
    id: "frontend",
    name: "Frontend Mastery",
    description: "Modern front-end architecture, performance, and UX best practices.",
    steps: [
      { title: "JavaScript", category: "languages" },
      { title: "TypeScript", category: "languages" },
      { title: "React", category: "frontend" },
      { title: "Next.js", category: "frontend" },
      { title: "Web Performance", category: "frontend" },
      { title: "Accessibility", category: "frontend" }
    ]
  },
  {
    id: "devops",
    name: "DevOps & Reliability",
    description: "Infrastructure, deployment, and production reliability.",
    steps: [
      { title: "Docker", category: "devops" },
      { title: "Kubernetes", category: "devops" },
      { title: "CI/CD", category: "devops" },
      { title: "Terraform", category: "devops" },
      { title: "SRE", category: "devops" },
      { title: "Observability", category: "system-design" }
    ]
  }
];

export const INTERVIEW_TRACKS: LearningPath[] = [
  {
    id: "interview-dsa",
    name: "DSA Interview Track",
    description: "High-frequency DSA topics and patterns for coding rounds.",
    steps: [
      { title: "Arrays", category: "dsa" },
      { title: "Hash Tables", category: "dsa" },
      { title: "Trees", category: "dsa" },
      { title: "Graphs", category: "dsa" },
      { title: "Dynamic Programming", category: "dsa" }
    ]
  },
  {
    id: "interview-system",
    name: "System Design Interview Track",
    description: "Core concepts and deep dives used in interviews.",
    steps: [
      { title: "Load Balancing", category: "system-design" },
      { title: "Caching", category: "system-design" },
      { title: "Database Sharding", category: "system-design" },
      { title: "Consistency Models", category: "system-design" },
      { title: "Rate Limiting", category: "system-design" }
    ]
  }
];
