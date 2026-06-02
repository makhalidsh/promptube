import { StructuredKnowledge } from '../types';

export function getDemoVideos(): StructuredKnowledge[] {
  return [
    {
      videoId: 'Yl3L-R9P9vA',
      videoTitle: 'The 24-Hour SaaS Builder: Rapid Engineering & Scaffolding',
      thumbnailUrl: 'https://img.youtube.com/vi/Yl3L-R9P9vA/maxresdefault.jpg',
      channelName: 'SaaS Labs',
      main_topic: 'Fast-paced SaaS engineering strategies emphasizing boilerplates, pre-built auth layers, serverless DB instances, and instant deployment models.',
      principles: [
        'Iterate on functionality first; validate customer demand prior to over-engineering systems.',
        'Use pre-built authentication, payment templates, and components to save up to 80% of scaffolding time.',
        'Choose fully-managed cloud serverless databases (like Supabase or Convex) to decouple host provisioning.'
      ],
      lessons: [
        'Initialize web apps within 30 minutes using custom templates equipped with integrated design tokens.',
        'Style interfaces strictly with Tailwind CSS containers and grid columns for instant responsiveness.',
        'Utilize server actions or serverless edge routes to bypass server running costs and complex CORS routes.',
        'Bind pricing and checkout elements to Stripe checkout portals rather than coding complex shopping-cart views.'
      ],
      warnings: [
        'Do not code custom OAuth or standard session-cookie schemas; utilize standard solutions like Clerk or NextAuth.',
        'Avoid writing complex custom database migrations during MVP stage; stick to automated schemas.',
        'Never delay deployment; launch a single working feature on day one to verify network routes and build stability.'
      ],
      examples: [
        'Deploying a complete web app with Vercel Git-connected pipelines for automatic preview builds.',
        'Seeding local tables using database dashboard consoles with drag-and-drop JSON uploads.'
      ],
      frameworks: ['Next.js', 'Tailwind CSS', 'Supabase', 'Stripe', 'Clerk'],
      tags: ['saas', 'mvp', 'database', 'next.js'],
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
      transcriptText: 'Welcome back builders! Today we are going through the complete 24-hour SaaS playbook. The golden rule is: never write code that you can import or configure. We scaffold a Next.js app, configure a Tailwind dark theme, plug in Supabase for standard SQL tables, use Clerk for seamless auth, and wire Stripe checkout in under 3 hours. Focus purely on the core value proposition of your application. Let\'s build!'
    },
    {
      videoId: 'L18dG2P-XoM',
      videoTitle: 'Clean Code: Decoupling Architecture and SOLID TypeScript',
      thumbnailUrl: 'https://img.youtube.com/vi/L18dG2P-XoM/maxresdefault.jpg',
      channelName: 'Architect Mind',
      main_topic: 'A comprehensive study of decoupled software patterns, object-oriented SOLID principles, and building highly testable backend API adapters in TypeScript.',
      principles: [
        'Single Responsibility: Each class or function must perform exactly one action and have one reason to change.',
        'Dependency Inversion: High-level business logic must never depend directly on low-level drivers or database ORMs.',
        'Open-Closed Principle: Code structures should be open for functional extension but closed for direct modifications.'
      ],
      lessons: [
        'Keep code functional blocks short; limit function sizes to under 25 lines of execution logic.',
        'Enforce type safety using rigorous TypeScript interfaces and absolute readonly parameters.',
        'Write simple unit tests with mock service fixtures before writing actual database implementation code.',
        'Abstract external API integrations behind standard gateway classes to allow swapping SDKs effortlessly.'
      ],
      warnings: [
        'Do not pollute core entity models with database-specific ORM schema definitions.',
        'Avoid deeply nested switch or conditional logic blocks; write clean guard statements with early returns.',
        'Never import backend business logic directly into frontend rendering nodes to prevent context degradation.'
      ],
      examples: [
        'Implementing a mock Repository interface class to test user registration without hitting PostgreSQL.',
        'Using factory patterns to cleanly instantiate varying third-party notification clients.'
      ],
      frameworks: ['TypeScript', 'SOLID', 'Design Patterns', 'Jest'],
      tags: ['clean code', 'architecture', 'typescript'],
      createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
      transcriptText: 'Hello engineers. Today we discuss clean code. Decoupling is the key to longevity in software. When you couple your code directly to Prisma or an external API like Twilio, you trap yourself. Enforce the Dependency Inversion Principle. Create abstract interfaces first. Build adapters. Write unit tests with clean mock fixtures. Ensure every class has exactly one responsibility. Let\'s review code.'
    },
    {
      videoId: 'T3m9q8R9a_s',
      videoTitle: 'Next.js 15 App Router: Server Components & Suspense Architecture',
      thumbnailUrl: 'https://img.youtube.com/vi/T3m9q8R9a_s/maxresdefault.jpg',
      channelName: 'Next.js Core',
      main_topic: 'Leveraging Server Components (RSC), asynchronous streaming layouts, dynamic routing hooks, and granular cache controls in Next.js 15.',
      principles: [
        'Server-first execution: Move data fetching, database requests, and heavy rendering to the server to shrink bundle sizes.',
        'Granular streaming bounds: Wrap dynamic components in React Suspense modules to stream contents asynchronously.',
        'Deterministic data caching: Enforce static optimization with smart tag-based revalidation triggers.'
      ],
      lessons: [
        'Retrieve database data directly inside async Server Components without establishing client-side fetch API routes.',
        'Wrap individual data-fetching modules with React Suspense and specify high-fidelity loading skeletons.',
        'Trigger instant cache revalidation in Server Actions using the Next.js revalidatePath or revalidateTag APIs.',
        'Pass plain serialized data fields across the server-client boundary to avoid hydration mismatch warnings.'
      ],
      warnings: [
        'Do not put "use client" on top-level pages or wrappers unless they require interactive browser hook listeners.',
        'Avoid making separate fetch requests to local API routes (/api/...) inside Server Components.',
        'Never ignore build warnings regarding searchParams; ensure proper promise awaiting in Next.js 15.'
      ],
      examples: [
        'Configuring a dynamic product card grid that streams images asynchronously while immediately displaying titles.',
        'Implementing server-side form validations using standard React useActionState and Zod.'
      ],
      frameworks: ['Next.js 15', 'React 19', 'RSCs', 'Tailwind CSS'],
      tags: ['next.js', 'performance', 'ui/ux'],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      transcriptText: 'What\'s up developers! Today we are looking at Next.js 15 and how to master React Server Components. With RSCs, your data fetches occur directly on the server, right next to your database, saving client bandwidth. Wrap your components in Suspense boundaries to stream content in chunks. Use Server Actions with useActionState to process forms securely. Let\'s jump into the code!'
    }
  ];
}
