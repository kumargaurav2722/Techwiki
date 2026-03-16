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

export const LANGUAGE_TRACKS: LearningPath[] = [
  {
    id: "lang-c",
    name: "C Programming",
    description: "Core systems programming from variables to pointers and memory management.",
    steps: [
      { title: "C Syntax and Variables", category: "languages" },
      { title: "C Control Flow (If, Switch)", category: "languages" },
      { title: "C Loops (For, While, Do-While)", category: "languages" },
      { title: "C Functions and Scope", category: "languages" },
      { title: "C Arrays and Strings", category: "languages" },
      { title: "C Pointers and Addresses", category: "languages" },
      { title: "C Dynamic Memory (malloc/free)", category: "languages" },
      { title: "C Structs and Unions", category: "languages" },
      { title: "C File Handling", category: "languages" },
    ]
  },
  {
    id: "lang-cpp",
    name: "C++ Mastery",
    description: "Modern C++ covering OOP, references, templates, and the STL.",
    steps: [
      { title: "C++ Basics and I/O", category: "languages" },
      { title: "C++ Variables and Types", category: "languages" },
      { title: "C++ Pointers and References", category: "languages" },
      { title: "C++ Loops and Conditionals", category: "languages" },
      { title: "C++ Functions and Overloading", category: "languages" },
      { title: "C++ Object-Oriented Programming", category: "languages" },
      { title: "C++ Constructors and Destructors", category: "languages" },
      { title: "C++ Inheritance and Polymorphism", category: "languages" },
      { title: "C++ Templates", category: "languages" },
      { title: "C++ Standard Template Library (STL)", category: "languages" },
      { title: "C++ Smart Pointers", category: "languages" },
    ]
  },
  {
    id: "lang-csharp",
    name: "C# Fundamentals",
    description: "Enterprise application development in the .NET ecosystem.",
    steps: [
      { title: "C# Syntax and Variables", category: "languages" },
      { title: "C# Control Flow and Loops", category: "languages" },
      { title: "C# Methods and Parameters", category: "languages" },
      { title: "C# Object-Oriented Programming", category: "languages" },
      { title: "C# Properties and Fields", category: "languages" },
      { title: "C# Interfaces and Abstract Classes", category: "languages" },
      { title: "C# Collections and Generics", category: "languages" },
      { title: "C# Exception Handling", category: "languages" },
      { title: "C# LINQ", category: "languages" },
      { title: "C# Async and Await", category: "languages" },
    ]
  },
  {
    id: "lang-java",
    name: "Java Developer",
    description: "Robust, class-based programming for enterprise and Android.",
    steps: [
      { title: "Java Basics and Syntax", category: "languages" },
      { title: "Java Data Types and Variables", category: "languages" },
      { title: "Java Loops and Conditionals", category: "languages" },
      { title: "Java Methods", category: "languages" },
      { title: "Java Object-Oriented Programming", category: "languages" },
      { title: "Java Constructors", category: "languages" },
      { title: "Java Inheritance and Polymorphism", category: "languages" },
      { title: "Java Interfaces and Abstract Classes", category: "languages" },
      { title: "Java Collections Framework", category: "languages" },
      { title: "Java Exception Handling", category: "languages" },
      { title: "Java Streams and Lambdas", category: "languages" },
    ]
  },
  {
    id: "lang-python",
    name: "Python Essentials",
    description: "Data, scripting, and web development with clean, readable syntax.",
    steps: [
      { title: "Python Syntax and Variables", category: "languages" },
      { title: "Python If...Else and Booleans", category: "languages" },
      { title: "Python For and While Loops", category: "languages" },
      { title: "Python Lists, Tuples, and Sets", category: "languages" },
      { title: "Python Dictionaries", category: "languages" },
      { title: "Python Functions and Lambdas", category: "languages" },
      { title: "Python Object-Oriented Programming", category: "languages" },
      { title: "Python Modules and Packages", category: "languages" },
      { title: "Python Exception Handling", category: "languages" },
      { title: "Python List Comprehensions", category: "languages" },
    ]
  },
  {
    id: "lang-js",
    name: "JavaScript Core",
    description: "The language of the web, from DOM manipulation to async programming.",
    steps: [
      { title: "JavaScript Variables (let, const, var)", category: "languages" },
      { title: "JavaScript Data Types", category: "languages" },
      { title: "JavaScript Control Flow", category: "languages" },
      { title: "JavaScript Functions and Arrows", category: "languages" },
      { title: "JavaScript Objects and Arrays", category: "languages" },
      { title: "JavaScript DOM Manipulation", category: "languages" },
      { title: "JavaScript Events", category: "languages" },
      { title: "JavaScript Promises and Async/Await", category: "languages" },
      { title: "JavaScript Closures and Scope", category: "languages" },
      { title: "JavaScript Modules", category: "languages" },
    ]
  },
  {
    id: "lang-go",
    name: "Go (Golang)",
    description: "Google's concurrent, fast, strongly-typed systems language.",
    steps: [
      { title: "Go Variables and Types", category: "languages" },
      { title: "Go Loops (For)", category: "languages" },
      { title: "Go If...Else and Switch", category: "languages" },
      { title: "Go Arrays and Slices", category: "languages" },
      { title: "Go Maps", category: "languages" },
      { title: "Go Pointers", category: "languages" },
      { title: "Go Structs and Methods", category: "languages" },
      { title: "Go Interfaces", category: "languages" },
      { title: "Go Error Handling", category: "languages" },
      { title: "Go Goroutines and Channels", category: "languages" },
    ]
  },
  {
    id: "lang-rust",
    name: "Rust Fundamentals",
    description: "Memory-safe systems programming without garbage collection.",
    steps: [
      { title: "Rust Variables and Mutability", category: "languages" },
      { title: "Rust Data Types", category: "languages" },
      { title: "Rust Functions", category: "languages" },
      { title: "Rust Control Flow", category: "languages" },
      { title: "Rust Ownership and Borrowing", category: "languages" },
      { title: "Rust Structs", category: "languages" },
      { title: "Rust Enums and Pattern Matching", category: "languages" },
      { title: "Rust Error Handling (Result, Option)", category: "languages" },
      { title: "Rust Collections (Vectors, HashMaps)", category: "languages" },
      { title: "Rust Traits and Generics", category: "languages" },
    ]
  }
];
