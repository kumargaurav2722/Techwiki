import { BookOpen, Code2, Database, Globe, Cpu, Layout as LayoutIcon, Layers, Shield, Terminal } from "lucide-react";

export const CATEGORIES = [
  {
    name: "Languages",
    icon: Code2,
    path: "languages",
    desc: "Explore programming languages, their syntax, and real-world use cases.",
    topics: [
      { name: "C", desc: "A foundational systems programming language." },
      { name: "C++", desc: "High-performance language with OOP and STL." },
      { name: "C#", desc: "Modern language for .NET applications." },
      { name: "Java", desc: "Class-based language used in enterprise systems." },
      { name: "Python", desc: "High-level language for scripting, data, and AI." },
      { name: "JavaScript", desc: "The programming language of the Web." },
      { name: "TypeScript", desc: "Typed superset of JavaScript for large apps." },
      { name: "Go", desc: "Concurrent, fast language designed at Google." },
      { name: "Rust", desc: "Memory-safe language for systems programming." },
      { name: "Kotlin", desc: "Modern JVM language for Android and backend." },
      { name: "Swift", desc: "Apple’s language for iOS and macOS." },
      { name: "PHP", desc: "Server-side scripting language for web." },
      { name: "Ruby", desc: "Dynamic language known for Rails." },
      { name: "SQL", desc: "Language for relational databases." },
      { name: "Bash", desc: "Shell scripting for automation and DevOps." }
    ]
  },
  {
    name: "Frontend",
    icon: LayoutIcon,
    path: "frontend",
    desc: "User interfaces, web performance, and modern front-end architectures.",
    topics: [
      { name: "React", desc: "A JavaScript library for building user interfaces." },
      { name: "Next.js", desc: "The React framework for full-stack web apps." },
      { name: "Angular", desc: "A TypeScript-based web framework." },
      { name: "Vue.js", desc: "The progressive JavaScript framework." },
      { name: "Svelte", desc: "A compiler-based UI framework." },
      { name: "Web Performance", desc: "Optimization techniques for fast websites." },
      { name: "Accessibility", desc: "Building inclusive, accessible web experiences." }
    ]
  },
  {
    name: "Backend",
    icon: Terminal,
    path: "backend",
    desc: "Server-side programming, APIs, and scalable systems.",
    topics: [
      { name: "Node.js", desc: "JavaScript runtime built on V8." },
      { name: "Express", desc: "Minimalist web framework for Node.js." },
      { name: "Django", desc: "High-level Python web framework." },
      { name: "FastAPI", desc: "High-performance Python API framework." },
      { name: "Spring Boot", desc: "Production-grade Spring applications." },
      { name: "REST APIs", desc: "Designing HTTP APIs." },
      { name: "GraphQL", desc: "Query language for APIs." },
      { name: "Authentication", desc: "Auth patterns, OAuth, JWT, and SSO." }
    ]
  },
  {
    name: "DSA",
    icon: Layers,
    path: "dsa",
    desc: "Data structures and algorithms for efficient problem solving.",
    topics: [
      { name: "Arrays", desc: "Contiguous memory collections." },
      { name: "Linked Lists", desc: "Node-based linear data structure." },
      { name: "Stacks and Queues", desc: "LIFO/FIFO data structures." },
      { name: "Hash Tables", desc: "Key-value lookup structure." },
      { name: "Trees", desc: "Hierarchical data structures." },
      { name: "Heaps", desc: "Priority queue structures." },
      { name: "Graphs", desc: "Nodes and edges for relationships." },
      { name: "Sorting Algorithms", desc: "Ordering data efficiently." },
      { name: "Dynamic Programming", desc: "Optimization via subproblems." },
      { name: "Greedy Algorithms", desc: "Local optimal choices for global results." },
      { name: "Tries", desc: "Prefix trees for fast lookup." }
    ]
  },
  {
    name: "System Design",
    icon: Database,
    path: "system-design",
    desc: "Designing scalable, reliable distributed systems.",
    topics: [
      { name: "Load Balancing", desc: "Distributing traffic across servers." },
      { name: "Caching", desc: "Reducing latency and load." },
      { name: "Consistent Hashing", desc: "Partitioning in distributed systems." },
      { name: "CAP Theorem", desc: "Consistency, Availability, Partition tolerance." },
      { name: "Rate Limiting", desc: "Protecting systems from overload." },
      { name: "Message Queues", desc: "Async communication between services." },
      { name: "Database Sharding", desc: "Splitting data across nodes." },
      { name: "Event-Driven Architecture", desc: "Systems built on events." },
      { name: "Observability", desc: "Logs, metrics, tracing." }
    ]
  },
  {
    name: "DBMS",
    icon: Database,
    path: "dbms",
    desc: "Database management systems, modeling, and performance.",
    topics: [
      { name: "SQL Basics", desc: "Core SQL queries and joins." },
      { name: "Normalization", desc: "Designing efficient schemas." },
      { name: "Indexing", desc: "Speeding up queries." },
      { name: "Transactions", desc: "ACID and isolation levels." },
      { name: "Query Optimization", desc: "Execution plans and tuning." },
      { name: "NoSQL", desc: "Document, key-value, and wide-column stores." }
    ]
  },
  {
    name: "OOP",
    icon: BookOpen,
    path: "oop",
    desc: "Object-oriented programming and design principles.",
    topics: [
      { name: "Encapsulation", desc: "Hiding internal state." },
      { name: "Inheritance", desc: "Extending and reusing behavior." },
      { name: "Polymorphism", desc: "Multiple forms, one interface." },
      { name: "SOLID Principles", desc: "Design guidelines for maintainability." },
      { name: "Design Patterns", desc: "Reusable solutions to common problems." }
    ]
  },
  {
    name: "DevOps",
    icon: Cpu,
    path: "devops",
    desc: "Delivery, infrastructure, and reliability practices.",
    topics: [
      { name: "Docker", desc: "Containerization fundamentals." },
      { name: "Kubernetes", desc: "Container orchestration platform." },
      { name: "CI/CD", desc: "Automated build and deployment." },
      { name: "Terraform", desc: "Infrastructure as code." },
      { name: "GitOps", desc: "Ops via Git workflows." },
      { name: "SRE", desc: "Site reliability engineering." }
    ]
  },
  {
    name: "Operating Systems",
    icon: Cpu,
    path: "operating-systems",
    desc: "Processes, memory, scheduling, and OS internals.",
    topics: [
      { name: "Processes and Threads", desc: "Execution and concurrency models." },
      { name: "CPU Scheduling", desc: "Scheduling algorithms and policies." },
      { name: "Memory Management", desc: "Paging, segmentation, and virtual memory." },
      { name: "File Systems", desc: "Storage structures and metadata." },
      { name: "Synchronization", desc: "Locks, semaphores, and deadlocks." }
    ]
  },
  {
    name: "Networking",
    icon: Globe,
    path: "networking",
    desc: "Computer networks and internet protocols.",
    topics: [
      { name: "TCP/IP", desc: "Core internet protocol suite." },
      { name: "HTTP/HTTPS", desc: "Web communication protocols." },
      { name: "DNS", desc: "Domain name resolution." },
      { name: "CDN", desc: "Content delivery networks." },
      { name: "TLS", desc: "Transport security and encryption." }
    ]
  },
  {
    name: "Security",
    icon: Shield,
    path: "security",
    desc: "Application and infrastructure security fundamentals.",
    topics: [
      { name: "Authentication", desc: "Identity and access management." },
      { name: "OWASP Top 10", desc: "Common web vulnerabilities." },
      { name: "Encryption", desc: "Protecting data in transit and at rest." },
      { name: "Threat Modeling", desc: "Identifying and mitigating risks." }
    ]
  },
  {
    name: "AI/ML",
    icon: Globe,
    path: "ai-ml",
    desc: "Machine learning and AI concepts.",
    topics: [
      { name: "Supervised Learning", desc: "Learning from labeled data." },
      { name: "Neural Networks", desc: "Core deep learning building blocks." },
      { name: "LLMs", desc: "Large language models and applications." },
      { name: "MLOps", desc: "Deploying and monitoring ML systems." }
    ]
  },
  {
    name: "Blockchain",
    icon: Globe,
    path: "blockchain",
    desc: "Decentralized technologies and cryptographic ledgers.",
    topics: [
      { name: "Smart Contracts", desc: "Automated on-chain logic." },
      { name: "Ethereum", desc: "A decentralized smart contract platform." },
      { name: "Consensus Mechanisms", desc: "Agreement protocols for chains." }
    ]
  },
  {
    name: "Cryptography",
    icon: Shield,
    path: "cryptography",
    desc: "Secure communication and data protection techniques.",
    topics: [
      { name: "RSA", desc: "Public-key encryption." },
      { name: "AES", desc: "Symmetric encryption standard." },
      { name: "Hash Functions", desc: "One-way functions for integrity." },
      { name: "Digital Signatures", desc: "Authenticity and non-repudiation." }
    ]
  }
];
