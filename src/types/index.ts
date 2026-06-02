export interface StructuredKnowledge {
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  channelName?: string;
  main_topic: string;
  principles: string[];
  lessons: string[];
  warnings: string[];
  examples: string[];
  frameworks: string[];
  tags: string[];
  createdAt: string;
  transcriptText: string;
}

export type TargetAI =
  | 'Cursor'
  | 'Claude Code' 
  | 'Gemini CLI' 
  | 'Windsurf' 
  | 'Bolt' 
  | 'Lovable' 
  | 'OpenAI Codex' 
  | 'Generic AI'
  // Creative & Audio/Video
  | 'Claude.ai (Web)'
  | 'ChatGPT Plus'
  | 'Google Gemini Web'
  | 'Midjourney (Images)'
  | 'Descript (AV Editor)'
  | 'CapCut / Premiere AI'
  | 'ElevenLabs (Voice)'
  // Business & Startup
  | 'v0 by Vercel'
  | 'Agentic CRM Planner';

export type PromptType = 
  // Software Engineering
  | 'UI Improvement'
  | 'UX Improvement'
  | 'Feature Implementation'
  | 'Refactor'
  | 'Bug Fix'
  | 'Design System'
  | 'Mobile Optimization'
  | 'Performance Optimization'
  | 'Accessibility Audit'
  | 'Database Schema Design'
  | 'API Integration'
  | 'Unit Test Suite Generator'
  | 'Security Hardening'
  | 'DevOps & CI/CD Pipeline'
  | 'General Development'
  // Content Creation
  | 'News Video Script Creator'
  | 'Story Adaptation & Recreation'
  | 'YouTube Video Script'
  | 'Technical Blog Post Writer'
  | 'Social Media Content Pack'
  | 'Podcast Outline & Script'
  | 'Interactive Storyboard'
  // Startup & Marketing
  | 'Startup MVP Spec'
  | 'SaaS Pitch Deck Outline'
  | 'Go-To-Market Plan'
  | 'Marketing Campaign Strategy'
  | 'SEO Article Outline'
  | 'Customer Support Playbook';

export interface PromptConfig {
  promptType: PromptType;
  targetAi: TargetAI;
  strength: 'conservative' | 'balanced' | 'aggressive';
  toggles: {
    addFeatures: boolean;
    createTodo: boolean;
    preserveDesign: boolean;
    mobileFirst: boolean;
    accessibilityFocus: boolean;
    performanceFocus: boolean;
    productionReady: boolean;
    mvpMode: boolean;
    seniorMode: boolean;
    layer: 'ui-only' | 'backend-only' | 'fullstack';
  };
  additionalContext?: string;
}
