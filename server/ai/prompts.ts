export type PromptInput = {
  category: string;
  topic: string;
};

const baseRules = `You are a senior technical writer for a professional, Wikipedia-style tech encyclopedia.
Write in-depth content suitable for industry practitioners and interview preparation.
Use precise terminology, avoid fluff, and include trade-offs and real-world nuance.
Format strictly in Markdown with headings (##, ###), bullet lists, and code blocks with language tags.
Include a final section titled "## References" with 5-8 authoritative sources as Markdown links.
Do not include conversational filler. Output only the article Markdown.`;

const commonSections = `## Summary\n\n## Core Concepts\n\n## Key Terms\n\n## Use Cases\n\n## Pros and Cons\n\n## See Also\n\n## References\n`;

const dsaTemplate = `## Summary\n\n## Core Concepts\n\n## Complexity Analysis\n- Time complexity\n- Space complexity\n\n## Detailed Explanation\n\n## Implementation\n- Python\n- Java\n- C++\n- JavaScript\n\n## Variations and Extensions\n\n## Edge Cases and Pitfalls\n\n## Interview Patterns\n- Common problem types\n- How to identify when to use this\n\n## Practice Questions (with hints)\n\n## See Also\n\n## References\n`;

const systemDesignTemplate = `## Summary\n\n## Requirements\n- Functional requirements\n- Non-functional requirements\n\n## High-Level Architecture\n\n## Data Model\n\n## API Design\n\n## Components and Responsibilities\n\n## Scalability and Performance\n- Caching strategy\n- Load balancing\n- Data partitioning/sharding\n\n## Reliability and Fault Tolerance\n- Replication\n- Failover\n- Backups\n\n## Consistency and Trade-offs\n\n## Security and Compliance\n\n## Cost Considerations\n\n## Bottlenecks and Mitigations\n\n## Interview Deep Dive\n- Common follow-up questions\n- Trade-off discussions\n\n## See Also\n\n## References\n`;

const languageTemplate = `## Summary\n\n## History and Background\n\n## Paradigms and Type System\n\n## Core Syntax and Features\n\n## Standard Library and Tooling\n\n## Ecosystem and Frameworks\n\n## Performance Characteristics\n\n## Best Practices\n\n## Common Pitfalls\n\n## Learning Path (Step-by-Step)\n\n## Real-World Uses\n\n## See Also\n\n## References\n`;

const dbmsTemplate = `## Summary\n\n## Architecture Overview\n\n## Data Modeling\n\n## Indexing and Query Optimization\n\n## Transactions and Concurrency\n\n## Replication and High Availability\n\n## Security\n\n## Performance Tuning\n\n## Use Cases\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;

const oopTemplate = `## Summary\n\n## Core Principles\n- Encapsulation\n- Abstraction\n- Inheritance\n- Polymorphism\n\n## Design Patterns\n\n## SOLID Principles\n\n## Common Pitfalls\n\n## Best Practices\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;

const frontendTemplate = `## Summary\n\n## Core Concepts\n\n## Architecture and State Management\n\n## Performance and Optimization\n\n## Accessibility\n\n## Security Considerations\n\n## Tooling and Build Systems\n\n## Best Practices\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;

const backendTemplate = `## Summary\n\n## Core Concepts\n\n## API Design\n\n## Data Access and Storage\n\n## Performance and Scaling\n\n## Security\n\n## Observability\n\n## Best Practices\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;

const devopsTemplate = `## Summary\n\n## Core Concepts\n\n## CI/CD Pipelines\n\n## Infrastructure as Code\n\n## Monitoring and Observability\n\n## Security and Compliance\n\n## Scaling and Reliability\n\n## Best Practices\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;

const generalTemplate = commonSections;

function categoryTemplate(category: string) {
  const key = category.toLowerCase();
  if (key.includes("dsa") || key.includes("data-structures") || key.includes("algorithms")) return dsaTemplate;
  if (key.includes("system-design") || key.includes("architecture")) return systemDesignTemplate;
  if (key.includes("language")) return languageTemplate;
  if (key.includes("dbms") || key.includes("database")) return dbmsTemplate;
  if (key.includes("oops") || key.includes("oop") || key.includes("object")) return oopTemplate;
  if (key.includes("frontend")) return frontendTemplate;
  if (key.includes("backend")) return backendTemplate;
  if (key.includes("devops")) return devopsTemplate;
  if (key.includes("operating-system") || key.includes("os")) return `## Summary\n\n## Core Concepts\n\n## Process and Thread Model\n\n## Scheduling\n\n## Memory Management\n\n## File Systems\n\n## Synchronization and Deadlocks\n\n## Performance Considerations\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;
  if (key.includes("network")) return `## Summary\n\n## Core Concepts\n\n## Protocol Stack\n\n## Routing and Switching\n\n## Performance and Latency\n\n## Security Considerations\n\n## Real-World Use Cases\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;
  if (key.includes("security") || key.includes("cryptography")) return `## Summary\n\n## Threat Model\n\n## Core Concepts\n\n## Common Attacks and Defenses\n\n## Security Best Practices\n\n## Real-World Use Cases\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;
  if (key.includes("ai") || key.includes("ml")) return `## Summary\n\n## Core Concepts\n\n## Algorithms and Models\n\n## Data and Training\n\n## Evaluation Metrics\n\n## Deployment and MLOps\n\n## Real-World Use Cases\n\n## Interview Deep Dive\n\n## See Also\n\n## References\n`;
  return generalTemplate;
}

export function buildPrompt(input: PromptInput) {
  const { category, topic } = input;
  const template = categoryTemplate(category);

  return `${baseRules}\n\nWrite an in-depth article about "${topic}" in the context of "${category}".\n\nUse this outline (adapt if needed, but keep all major sections):\n\n${template}\n\nAdditional requirements:\n- Provide at least 2 code examples when applicable.\n- Prefer real-world industry practices and interview-ready explanations.\n- In the \"See Also\" section, include 4-6 internal links like [Topic](/wiki/category/topic-slug).\n- In the \"References\" section, include 5-8 authoritative sources with URLs.`;
}
