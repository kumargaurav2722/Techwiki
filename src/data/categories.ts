import { BookOpen, Code2, Database, Globe, Cpu, Layout as LayoutIcon, Layers, Shield, Terminal } from "lucide-react";

export const CATEGORIES = [
  { 
    name: "Languages", 
    icon: Code2, 
    path: "languages", 
    desc: "Explore programming languages, their syntax, and use cases.",
    topics: [
      { name: "Python", desc: "A high-level, general-purpose programming language." },
      { name: "Java", desc: "A class-based, object-oriented programming language." },
      { name: "Rust", desc: "A language empowering everyone to build reliable and efficient software." },
      { name: "Go", desc: "An open source programming language supported by Google." },
      { name: "JavaScript", desc: "The programming language of the Web." },
      { name: "TypeScript", desc: "A strongly typed programming language that builds on JavaScript." }
    ]
  },
  { 
    name: "Frontend", 
    icon: LayoutIcon, 
    path: "frontend", 
    desc: "Learn about building user interfaces and web applications.",
    topics: [
      { name: "React", desc: "A JavaScript library for building user interfaces." },
      { name: "Next.js", desc: "The React Framework for the Web." },
      { name: "Angular", desc: "A web development framework for building the future." },
      { name: "Vue.js", desc: "The Progressive JavaScript Framework." }
    ]
  },
  { 
    name: "Backend", 
    icon: Terminal, 
    path: "backend", 
    desc: "Server-side programming, APIs, and database interactions.",
    topics: [
      { name: "Node.js", desc: "A JavaScript runtime built on Chrome's V8 JavaScript engine." },
      { name: "Express", desc: "Fast, unopinionated, minimalist web framework for Node.js." },
      { name: "Spring Boot", desc: "Create stand-alone, production-grade Spring based Applications." },
      { name: "Django", desc: "A high-level Python web framework that encourages rapid development." }
    ]
  },
  { 
    name: "DSA", 
    icon: Layers, 
    path: "dsa", 
    desc: "Data Structures and Algorithms for efficient problem solving.",
    topics: [
      { name: "Arrays", desc: "A collection of items stored at contiguous memory locations." },
      { name: "Linked Lists", desc: "A linear collection of data elements whose order is not given by their physical placement in memory." },
      { name: "Trees", desc: "A widely used abstract data type that simulates a hierarchical tree structure." },
      { name: "Graphs", desc: "A non-linear data structure consisting of nodes and edges." },
      { name: "Dynamic Programming", desc: "An algorithmic technique for solving an optimization problem by breaking it down into simpler subproblems." }
    ]
  },
  { 
    name: "System Design", 
    icon: Database, 
    path: "system-design", 
    desc: "Architecting scalable and reliable software systems.",
    topics: [
      { name: "Consistent Hashing", desc: "A distributed hashing scheme that operates independently of the number of servers or objects in a distributed hash table." },
      { name: "CAP Theorem", desc: "States that it is impossible for a distributed data store to simultaneously provide more than two out of three guarantees." },
      { name: "Microservices", desc: "An architectural style that structures an application as a collection of services." },
      { name: "Load Balancing", desc: "The process of distributing a set of tasks over a set of resources, with the aim of making their overall processing more efficient." }
    ]
  },
  { 
    name: "DevOps", 
    icon: Cpu, 
    path: "devops", 
    desc: "Practices and tools for software delivery and infrastructure.",
    topics: [
      { name: "Docker", desc: "A set of platform as a service products that use OS-level virtualization to deliver software in packages called containers." },
      { name: "Kubernetes", desc: "An open-source container orchestration system for automating software deployment, scaling, and management." },
      { name: "CI/CD", desc: "Continuous integration and continuous delivery/continuous deployment." },
      { name: "Terraform", desc: "An open-source infrastructure as code software tool." }
    ]
  },
  { 
    name: "Blockchain", 
    icon: Globe, 
    path: "blockchain", 
    desc: "Decentralized technologies and cryptographic ledgers.",
    topics: [
      { name: "Smart Contracts", desc: "Computer programs or a transaction protocol which is intended to automatically execute, control or document legally relevant events." },
      { name: "Ethereum", desc: "A decentralized, open-source blockchain with smart contract functionality." },
      { name: "Consensus Mechanisms", desc: "Fault-tolerant mechanisms that are used in computer and blockchain systems to achieve the necessary agreement on a single data value." }
    ]
  },
  { 
    name: "Cryptography", 
    icon: Shield, 
    path: "cryptography", 
    desc: "Secure communication and data protection techniques.",
    topics: [
      { name: "RSA", desc: "A public-key cryptosystem that is widely used for secure data transmission." },
      { name: "AES", desc: "A specification for the encryption of electronic data established by the U.S. National Institute of Standards and Technology." },
      { name: "Hash Functions", desc: "Any function that can be used to map data of arbitrary size to fixed-size values." }
    ]
  }
];
