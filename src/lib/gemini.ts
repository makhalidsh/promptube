import { GoogleGenerativeAI } from '@google/generative-ai';
import { StructuredKnowledge, PromptConfig } from '../types';

/**
 * Clean and truncate transcript to avoid token issues in free usage
 */
function truncateText(text: string, maxChars = 24000): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '... [Transcript Truncated]';
}

function sanitizeModelName(model: string): string {
  const m = model.trim().toLowerCase();
  if (m === 'gemini-1.5-pro' || m === 'models/gemini-1.5-pro') return 'gemini-2.5-pro';
  if (m === 'gemini-1.5-flash' || m === 'models/gemini-1.5-flash') return 'gemini-2.5-flash';
  return model;
}

/**
 * Extracts structured knowledge from transcript using Gemini API (if key available) or local fallback parser.
 */
export async function extractKnowledge(
  transcriptText: string,
  videoTitle: string,
  videoId: string,
  thumbnailUrl: string,
  channelName: string,
  apiKey?: string,
  geminiModel: string = 'gemini-2.5-flash'
): Promise<StructuredKnowledge> {
  const truncatedTranscript = truncateText(transcriptText);

  if (apiKey && apiKey.trim() !== '') {
    try {
      // Direct client-side Gemini call
      const ai = new GoogleGenerativeAI(apiKey);
      const systemInstruction = 
        `You are a world-class AI developer and technical analyst. 
        Your task is to analyze the following YouTube video transcript and extract high-value, actionable structured knowledge.
        
        This is NOT a generic summary. We need to extract the actionable developer/designer principles, hard technical lessons, critical warnings, code patterns or examples, and frameworks mentioned in the video.
        
        Format your response EXACTLY as a valid JSON object with the following schema:
        {
          "main_topic": "A short, concise summary of the core thesis (1-2 sentences)",
          "principles": ["List of 3-5 core underlying philosophies or technical principles explained"],
          "lessons": ["List of 4-6 specific, highly actionable lessons or code implementation instructions"],
          "warnings": ["List of 2-4 critical traps, bugs, architectural mistakes, or bad practices to avoid"],
          "examples": ["List of specific real-world examples, use-cases, or code patterns mentioned"],
          "frameworks": ["List of frameworks, libraries, technologies, or methodologies named or discussed (e.g. Next.js, Tailwind, SOLID)"]
        }
        
        Do not wrap the output in markdown code blocks (e.g. \`\`\`json) - return ONLY the raw JSON string.`;

      const model = ai.getGenerativeModel({ 
        model: sanitizeModelName(geminiModel),
        systemInstruction
      });

      const prompt = `Video Title: "${videoTitle}"\nChannel: "${channelName}"\nTranscript:\n${truncatedTranscript}`;
      
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });

      const responseText = response.response.text();
      const parsedData = JSON.parse(responseText.trim());

      return {
        videoId,
        videoTitle,
        thumbnailUrl,
        channelName,
        main_topic: parsedData.main_topic || `Analysis of ${videoTitle}`,
        principles: parsedData.principles || [],
        lessons: parsedData.lessons || [],
        warnings: parsedData.warnings || [],
        examples: parsedData.examples || [],
        frameworks: parsedData.frameworks || [],
        tags: generateTags(parsedData.frameworks || [], parsedData.main_topic || ''),
        createdAt: new Date().toISOString(),
        transcriptText,
      };
    } catch (error) {
      console.error('Gemini extraction failed, falling back to local extractor:', error);
      // Fall back to local scraper
    }
  }

  // Fallback Rule-based Local Knowledge Extractor (Runs client-side instantly, 100% reliable)
  return extractLocalKnowledge(transcriptText, videoTitle, videoId, thumbnailUrl, channelName);
}

/**
 * Client-Side Heuristic Knowledge Extractor
 * Parses transcripts using semantic analysis to find advice, warnings, examples and tech terms.
 */
function extractLocalKnowledge(
  transcriptText: string,
  videoTitle: string,
  videoId: string,
  thumbnailUrl: string,
  channelName: string
): StructuredKnowledge {
  const sentences = transcriptText
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const principles: string[] = [];
  const lessons: string[] = [];
  const warnings: string[] = [];
  const examples: string[] = [];
  const frameworks: string[] = [];

  // Technology scanning dictionary
  const techKeywords = [
    'React', 'Next.js', 'TypeScript', 'Tailwind', 'Node.js', 'PostgreSQL', 'Supabase', 
    'Prisma', 'Docker', 'AWS', 'Vercel', 'Python', 'Go', 'Zustand', 'Redux', 'GraphQL', 
    'REST', 'CI/CD', 'Git', 'OpenAI', 'Gemini', 'Cursor', 'shadcn', 'Figma', 'UI', 'UX',
    'SOLID', 'Microservices', 'Serverless', 'Clean Code', 'Agile', 'MVC', 'ORM'
  ];

  // Scan frameworks
  techKeywords.forEach(tech => {
    const regex = new RegExp(`\\b${tech}\\b`, 'i');
    if (regex.test(videoTitle) || regex.test(transcriptText.substring(0, 10000))) {
      frameworks.push(tech);
    }
  });

  if (frameworks.length === 0) {
    frameworks.push('Web Development', 'Software Architecture');
  }

  // Sentiment matching keywords
  const warnWords = ['avoid', 'never', 'don\'t', 'pitfall', 'trap', 'bug', 'mistake', 'warning', 'bad practice', 'incorrectly'];
  const principleWords = ['key', 'fundamental', 'rule', 'core', 'always', 'philosophy', 'must', 'essential', 'standard'];
  const lessonWords = ['how to', 'implement', 'create', 'should', 'design', 'write', 'learn', 'build', 'step', 'use'];
  const exampleWords = ['for example', 'such as', 'like in', 'instance', 'e.g.', 'case of', 'specifically'];

  // Smart sentence classifier
  for (const sentence of sentences) {
    const cleanSentence = sentence.replace(/^[-\*\s\d\.\)]+/, '').trim();
    if (cleanSentence.length < 30 || cleanSentence.length > 150) continue;

    const lower = cleanSentence.toLowerCase();

    // Check warnings
    if (warnWords.some(word => lower.includes(word)) && warnings.length < 4) {
      if (!warnings.includes(cleanSentence)) warnings.push(cleanSentence);
      continue;
    }

    // Check principles
    if (principleWords.some(word => lower.includes(word)) && principles.length < 4) {
      if (!principles.includes(cleanSentence)) principles.push(cleanSentence);
      continue;
    }

    // Check examples
    if (exampleWords.some(word => lower.includes(word)) && examples.length < 3) {
      if (!examples.includes(cleanSentence)) examples.push(cleanSentence);
      continue;
    }

    // Check lessons
    if (lessonWords.some(word => lower.includes(word)) && lessons.length < 5) {
      if (!lessons.includes(cleanSentence)) lessons.push(cleanSentence);
    }
  }

  // Generative default values if parser returns too few matches
  if (principles.length < 2) {
    principles.push(
      `Prioritize modular and highly cohesive architecture components to ensure maintainability.`,
      `Design system scalability starting with simple, well-defined data models.`
    );
  }
  if (lessons.length < 2) {
    lessons.push(
      `Decouple components clearly using abstract interfaces or standard API contracts.`,
      `Utilize client-side browser caching to improve layout speeds and decrease server costs.`
    );
  }
  if (warnings.length === 0) {
    warnings.push(
      `Avoid using tightly coupled dependencies that inhibit scaling and component testability.`,
      `Do not commit hardcoded secrets or sensitive API credentials to version control.`
    );
  }
  if (examples.length === 0) {
    examples.push(
      `Setting up lightweight database migrations to incrementally scale database tables.`,
      `Structuring standard folder paths that separate concerns (components, hooks, lib).`
    );
  }

  // Formulate a clean, professional main topic
  const mainTopic = `This video explores core development paradigms, focusing on structural clean code principles, scalable setups using ${frameworks.slice(0, 3).join(', ')}, and optimizing modern workflows.`;

  return {
    videoId,
    videoTitle,
    thumbnailUrl,
    channelName,
    main_topic: mainTopic,
    principles: principles.slice(0, 4),
    lessons: lessons.slice(0, 5),
    warnings: warnings.slice(0, 3),
    examples: examples.slice(0, 3),
    frameworks,
    tags: generateTags(frameworks, mainTopic),
    createdAt: new Date().toISOString(),
    transcriptText,
  };
}

function generateTags(frameworks: string[], mainTopic: string): string[] {
  const tagsSet = new Set<string>();
  
  frameworks.forEach(f => tagsSet.add(f.toLowerCase()));
  
  if (mainTopic.toLowerCase().includes('design') || mainTopic.toLowerCase().includes('ui')) {
    tagsSet.add('design');
    tagsSet.add('ui/ux');
  }
  if (mainTopic.toLowerCase().includes('backend') || mainTopic.toLowerCase().includes('database')) {
    tagsSet.add('backend');
  }
  if (mainTopic.toLowerCase().includes('performance') || mainTopic.toLowerCase().includes('speed')) {
    tagsSet.add('performance');
  }
  
  // Fallbacks
  if (tagsSet.size === 0) {
    tagsSet.add('engineering');
    tagsSet.add('architecture');
  }

  return Array.from(tagsSet).slice(0, 4);
}

/**
 * Builds a professional custom AI coding prompt based on selected video knowledge and user configuration toggles.
 */
export async function generatePrompt(
  knowledgeEntries: StructuredKnowledge[],
  config: PromptConfig,
  apiKey?: string,
  geminiModel: string = 'gemini-2.5-flash'
): Promise<string> {
  const titles = knowledgeEntries.map(k => k.videoTitle).join(', ');

  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ 
        model: sanitizeModelName(geminiModel),
        systemInstruction: `You are a master AI prompt engineer specializing in prompt creation for developer agents (like Cursor, Claude Code, Windsurf, Bolt, Lovable) and technical content creation agents.
        
        Your objective is to craft an incredibly detailed, high-fidelity compiled instruction prompt tailored to help a user build their specific desired project.
        
        The user wants to build a project specified in the User Goal parameter: "${config.additionalContext || config.promptType}".
        
        You are provided with up to 3 technical videos as separate input parameter blocks, each describing distinct principles, lessons, warnings, examples, and technologies.
        
        Your job is to understand and synthesize the technical architectural patterns, lessons, and instructions from all the provided video parameters, merge them intelligently, and weave them directly into the compiled prompt.
        
        Format the compiled prompt strictly using the professional **CO-STAR** Prompt Engineering Framework:
        1. **CONTEXT**: Define the technology stack, reference videos, and technical patterns. List each video's specific parameter contribution.
        2. **OBJECTIVE**: Detail the user's exact goal ("${config.additionalContext || config.promptType}") and execution scope based on the prompt strength ("${config.strength}").
        3. **STYLE**: Instruct the executing agent to act as an elite technical architect or role appropriate for the user's goal.
        4. **TONE**: Analytical, precise, professional, and direct.
        5. **AUDIENCE**: The target executing agent ("${config.targetAi}"). Provide native tool mechanic guides.
        6. **RESPONSE FORMAT**: Define exactly how the agent should structure its reply (e.g. modular files, task lists, terminal verification).
        
        CRITICAL RULES:
        - DO NOT include emojis in the compiled prompt.
        - Tailor the prompt to be highly structured using standard XML tags (e.g. <tech_stack>, <code_style_mandates>, <deliverables_format>).
        - Direct the executing agent to address the user's project requirements while strictly respecting the architectural parameters and constraints of each video.
        - Write in clear, authoritative, and professional markdown.`
      });

      // Construct a highly structured user prompt with distinct video parameters and the user request
      const videoParametersText = knowledgeEntries.map((k, i) => `
<video_parameter_${i + 1}>
  <title>${k.videoTitle}</title>
  <channel>${k.channelName || 'YouTube'}</channel>
  <main_thesis>${k.main_topic}</main_thesis>
  <principles>
    ${k.principles.map(p => `- ${p}`).join('\n    ')}
  </principles>
  <lessons>
    ${k.lessons.map(l => `- ${l}`).join('\n    ')}
  </lessons>
  <warnings>
    ${k.warnings.map(w => `- ${w}`).join('\n    ')}
  </warnings>
  <examples>
    ${k.examples.map(e => `- ${e}`).join('\n    ')}
  </examples>
  <frameworks>${k.frameworks.join(', ')}</frameworks>
</video_parameter_${i + 1}>`).join('\n');

      const userContentPrompt = `
Generate a professional emoji-free CO-STAR compiled prompt tailored to the following specifications:

<user_goal>
${config.additionalContext || `Build a high-performance application implementing the prompt type: ${config.promptType}`}
</user_goal>

<target_agent>${config.targetAi}</target_agent>
<prompt_strength>${config.strength}</prompt_strength>

<input_video_parameters>
${videoParametersText}
</input_video_parameters>

Please synthesize and merge the technical instructions from the video parameters above, giving each parameter block due influence. Weave them into the final CO-STAR instruction prompt so the executing agent builds exactly what the user wants in the <user_goal>.`;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userContentPrompt }] }],
        generationConfig: {
          temperature: 0.3,
        }
      });

      const responseText = response.response.text();
      if (responseText) {
        return responseText.trim();
      }
    } catch (e) {
      console.error('Gemini prompt generation failed, falling back to local engine:', e);
    }
  }

  // Sophisticated Fallback Prompt Builder Engine
  return generateLocalPrompt(knowledgeEntries, config);
}

/**
 * Local deterministic prompt engine that formats a magnificent AI coding prompt
 * incorporating video findings, specific AI tool mechanics, prompt strength, and toggles.
 */
function generateLocalPrompt(knowledgeEntries: StructuredKnowledge[], config: PromptConfig): string {
  const target = config.targetAi;
  const type = config.promptType;
  const strength = config.strength;
  const toggles = config.toggles;
  const titles = knowledgeEntries.map(k => k.videoTitle).join(', ');

  // Categorize prompt type
  const isContentCreator = [
    'News Video Script Creator',
    'Story Adaptation & Recreation',
    'YouTube Video Script',
    'Technical Blog Post Writer',
    'Social Media Content Pack',
    'Podcast Outline & Script',
    'Interactive Storyboard'
  ].includes(type);

  const isBusinessStartup = [
    'Startup MVP Spec',
    'SaaS Pitch Deck Outline',
    'Go-To-Market Plan',
    'Marketing Campaign Strategy',
    'SEO Article Outline',
    'Customer Support Playbook'
  ].includes(type);

  // Custom tool/audience guidance injection
  let agentGuidance = '';
  switch (target) {
    case 'Cursor':
      agentGuidance = isContentCreator || isBusinessStartup 
        ? `* Cursor Workspace Integration: Organize all script scenes, outlines, and strategies into clean, structured Markdown files. Keep adjacent files organized.
* Rule File Integration: Format deliverables to align with any workspace writing guidelines or documentation frameworks in the repository.
* No Placeholders: Write complete, fully articulated text and script scenes. Do not use shorthand or omit dialogues.`
        : `* Cursor Composer Multi-File Pattern: Enforce modular, multi-file code splits. Leverage the Composer mode to update adjacent files seamlessly.
* Rule File Integration: Always check for and respect the local \`.cursorrules\` styles, formatting, and naming conventions.
* Explicit Referencing: Instruct the user on which files to reference with the \`@\` symbol in their Cursor chat to ensure complete context.
* No Placeholders: Never output incomplete files or comments like \`// existing code...\`. Always write fully implemented drop-in file replacements.`;
      break;
    case 'Claude Code':
      agentGuidance = isContentCreator || isBusinessStartup
        ? `* CLI & Git Integration: Organize and save files utilizing standard command line utilities. Ensure all content files compile/render cleanly before concluding.
* Atomic Diffs: Maintain highly focused content updates, keeping file modifications well-grouped.
* Non-Interactive Execution: Propose commands that run synchronously and do not require user interruptions.`
        : `* CLI & Git Integration: Execute tasks by invoking standard terminal utilities where appropriate. Ensure all modified files compile cleanly before concluding.
* Atomic Diffs: Keep file changes focused, localized, and well-grouped to minimize git merge friction.
* Non-Interactive Execution: Propose commands that run synchronously and do not require user prompt interruptions.
* Linter Compliance: Run the project linter immediately after editing files, and correct any type checks or formatting lints.`;
      break;
    case 'Gemini CLI':
      agentGuidance = `* Single-Execution Scripts: Compile executable scripts or commands for complex tasks.
* Explicit Context Passing: Provide clear inline commentary detailing how terminal params map to the execution arguments.
* Zero Interactive Prompts: Keep script runs strictly static and non-interactive.`;
      break;
    case 'Windsurf':
      agentGuidance = isContentCreator || isBusinessStartup
        ? `* Cascade Agent Reasoning: Review folder structures and research workspace files before drafting templates.
* Incremental Implementation: Structure outlines and transcripts sequentially, validating flow page-by-page.
* Defensive Review: Perform thorough readability passes to eliminate structural errors.`
        : `* Cascade Agent Reasoning: Leverage Windsurf's Cascade reasoning flow. Before editing, scan directory maps, research codebase configuration files, and establish a search plan.
* Incremental Implementation: Execute edits file-by-file, verifying each block compiles before proceeding to the next.
* Defensive Diagnostics: Proactively diagnose issues by running test suites or checking error logs.`;
      break;
    case 'Bolt':
    case 'Lovable':
      agentGuidance = `* High-Fidelity Interactive Scaffolding: Deliver complete visual pages and interactive assets.
* Design Tokens: Enforce pure Tailwind CSS tokens, smooth transitions, clean layouts, and Outfit/Inter typography.
* State-of-the-Art Micro-Animations: Inject hover translations, micro-interactive badges, active-clicks, and smooth layout fade-ins.
* Mock Data Isolation: Package realistic mock datasets directly within components for instant visual preview.`;
      break;
    default:
      agentGuidance = isContentCreator || isBusinessStartup
        ? `* Elite Delivery Standards: Enforce structured styling, rigorous logic paths, and logical flow.
* Self-Documenting Layouts: Use highly descriptive section titles, clear headings, and clear formatting guidelines.`
        : `* Production-Grade Architecture: Enforce strict type-safety, robust error-boundaries, defensive checks, and separation of concerns.
* Self-Documenting Code: Write descriptive variable/function names and concise, meaningful comments.
* No Outdated Libraries: Use modern, stable package methods and standards.`;
  }

  // Strength adjustment
  let strengthGuidance = '';
  if (strength === 'conservative') {
    strengthGuidance = isContentCreator || isBusinessStartup
      ? `<execution_boundaries>
* Strict Scope Isolation: Keep updates strictly confined to identified sections and topics.
* Style Modification Ban: Do not change the core tone, branding, or formatting of existing templates.
* Minimal Intrusion: Make targeted, atomic edits. Prioritize preservation of original texts over rewrite options.
</execution_boundaries>`
      : `<execution_boundaries>
* Strict Scope Isolation: Restrict changes entirely to identified code pathways and immediate call sites.
* Refactoring Ban: Do not restructure folders, introduce new design tokens, or rewrite working layers.
* Minimal Intrusion: Make targeted, highly atomic modifications. Prioritize safety and backward-compatibility over styling updates.
</execution_boundaries>`;
  } else if (strength === 'balanced') {
    strengthGuidance = isContentCreator || isBusinessStartup
      ? `<execution_boundaries>
* Progressive Enhancements: Proactively improve flow, enrich vocabulary, and optimize readability.
* Context Respect: Retain the overall theme and structures, but do not hesitate to split chapters or clean up redundant outlines.
* Incremental Optimization: Balance original narrative voice with professional editorial standards.
</execution_boundaries>`
      : `<execution_boundaries>
* Progressive Enhancements: Proactively optimize components, clean up redundant utilities, and improve visual aesthetics.
* Architectural Respect: Maintain the core design patterns and folder structures, but feel free to extract reusable UI cards or refactor minor utilities if it simplifies code paths.
* Incremental Optimization: Balance code safety with modern quality standards. Add standard error boundaries and TypeScript types where missing.
</execution_boundaries>`;
  } else {
    strengthGuidance = isContentCreator || isBusinessStartup
      ? `<execution_boundaries>
* Aggressive Evolution: Re-write and re-architect the entire narrative framework where beneficial.
* Dynamic Recreation: Introduce highly engaging elements, hooks, emotional arcs, and multi-format adaptations.
* Modern Platform Formats: Adapt stories into video scripts, tweetstorms, and interactive media structures.
* Complete Restructuring: Break down dense chapters into clear, highly digestible content components.
</execution_boundaries>`
      : `<execution_boundaries>
* Aggressive Architectural Evolution: Re-architect and optimize layers wherever beneficial.
* Visual Re-design: Introduce premium aesthetics, responsive layouts, glassmorphic UI panels, harmonized gradients, and sleek micro-animations.
* Modern State & API Rewrite: Transition scattered states to clean hooks or state managers (e.g. Zustand) and rewrite legacy endpoints.
* Rigorous Component Splits: Break down monolithic components into highly reusable, single-responsibility files.
</execution_boundaries>`;
  }

  // Toggle parsing
  const checklist: string[] = [];
  if (toggles.addFeatures) {
    checklist.push(isContentCreator || isBusinessStartup 
      ? 'Add new sections, content topics, or strategic expansion plans.' 
      : 'Implement new feature expansions to enhance product scalability.');
  } else {
    checklist.push(isContentCreator || isBusinessStartup
      ? 'Restrict additions; focus strictly on refining and polishing existing chapters.'
      : 'Restrict additions; focus strictly on solidifying and optimizing existing endpoints.');
  }
  
  if (toggles.createTodo) checklist.push('Generate a clean markdown TODO list (task.md) at the root level before implementing changes.');
  
  if (toggles.preserveDesign) {
    checklist.push(isContentCreator || isBusinessStartup
      ? 'Maintain the original branding, tone of voice, and format guidelines.'
      : 'Maintain original CSS variables, palettes, and typography tokens. Do not alter current visual styles.');
  } else {
    checklist.push(isContentCreator || isBusinessStartup
      ? 'Introduce highly creative style iterations (captivating vocabulary, storytelling hooks, and clear visual pacing).'
      : 'Introduce sleek, modern design iterations (vibrant colors, clean glassmorphic panels, and smooth animations).');
  }

  if (toggles.mobileFirst) checklist.push(isContentCreator || isBusinessStartup ? 'Optimize visual spacing for standard smartphone screens.' : 'Prioritize mobile viewports using responsive grid layouts and clean touch interfaces.');
  if (toggles.accessibilityFocus) checklist.push(isContentCreator || isBusinessStartup ? 'Ensure language is clear, highly readable (Grade 8 reading level), and matches standard readability metrics.' : 'Ensure WCAG 2.1 AA accessibility (proper aria labels, keyboard navigation, and semantic tags).');
  if (toggles.performanceFocus) checklist.push(isContentCreator || isBusinessStartup ? 'Streamline visual scripts to keep hook retention extremely high and avoid fluff.' : 'Optimize load speeds, eliminate unnecessary re-renders, and use efficient data fetching methods.');
  if (toggles.productionReady) checklist.push(isContentCreator || isBusinessStartup ? 'Include complete sources, references, citations, and backup scripts.' : 'Implement comprehensive error boundaries, type safety, and rigorous logging.');
  if (toggles.mvpMode) checklist.push('Maintain an MVP focus: minimize overhead, write direct solutions, and prioritize time-to-value.');
  if (toggles.seniorMode) checklist.push(isContentCreator || isBusinessStartup ? 'Adopt a Senior Creative Director persona: build deep narrative arcs, logical thematic structures, and clear warnings.' : 'Adopt a Senior Architect persona: follow defensive coding, DRY, clean code principles, and add meaningful JSDoc comments.');

  // Custom prompt context tailoring based on Category
  let stylePersona = '';
  let styleMandatesXml = '';
  let techHeaderLabel = '';
  let deliverablesXml = '';

  if (isContentCreator) {
    const layer = config.toggles.layer;
    const creativeRole = layer === 'ui-only'
      ? 'Viral Short-Form Scriptwriter & Pacing Specialist'
      : layer === 'backend-only'
      ? 'Executive Audio Podcast Producer & Dialogue Writer'
      : 'Creative Director & Long-Form Cinematic Storyteller';
    stylePersona = `acting as an elite, senior-level **${creativeRole}** specialized in executing high-retention scripts and content adaptations for **${target}**.`;
    
    // Story adaptation specific mandates
    let adaptationDetails = '';
    if (type === 'News Video Script Creator') {
      adaptationDetails = `
- **News Formatting**: Adapt the core story into a formal broadcast news script. Include distinct speaker blocks (Anchor, Reporter, On-Scene Guest).
- **Pacing & Retainers**: Add clear cues for B-roll footage, screen graphics, and text overlays (lower-thirds) every 7-10 seconds to keep audience attention.
- **Intro Hooks**: Start with a high-impact hook summarizing the breaking news in under 5 seconds.`;
    } else if (type === 'Story Adaptation & Recreation') {
      adaptationDetails = `
- **Thematic Transformation**: Take the provided story details and recreate it into a completely new adapted format (e.g. shifting the perspective, adapting to a specific genre, or rewriting into dialogue-heavy screenplays).
- **Narrative Pacing**: Build an engaging three-act narrative arch (Setup, Confrontation, Resolution). Add clear speaker cues and dramatic visual beats.`;
    } else {
      adaptationDetails = `
- **High Retention Pacing**: Add B-roll markers, transitions, and audio effect directions to maintain viewers' retention.
- **Target Channel Adaptation**: Optimize visual script cues to align perfectly with the standard formats of the target platform (YouTube, Podcast, TikTok).`;
    }

    styleMandatesXml = `<content_quality_mandates>${adaptationDetails}
- **Tone & Dialogue**: Ensure dialogue sounds natural and conversational. Avoid academic or dry passive phrasing.
- **Clear Transitions**: Detail B-roll descriptions in brackets to guide editors. Mark audio/music transitions explicitly.
</content_quality_mandates>`;
    techHeaderLabel = 'PRODUCTION FORMAT & CHANNELS';
    deliverablesXml = `<deliverables_format>
1.  **Production Checklist (task.md at root)**: Detail your exact script compilation timeline in markdown before writing.
2.  **Full Script & Outline**: Deliver a complete script outline followed by full scenes, B-roll annotations, and speaker lines. Never use placeholders or shortened scenes.
3.  **Post-Production Guidelines**: Provide a clear checklist for editors, visual designers, and vocal actors to successfully execute the script.
</deliverables_format>`;
  } else if (isBusinessStartup) {
    const layer = config.toggles.layer;
    const businessRole = layer === 'ui-only'
      ? 'Lean MVP Startup Specialist & Product Analyst'
      : layer === 'backend-only'
      ? 'Elite Venture Capital Strategist & Financial Pitch Writer'
      : 'Chief Growth Officer & Veteran Customer Acquisition Marketer';
    stylePersona = `acting as a veteran **${businessRole}** specialized in compiling strategic startup spec sheets and market playbooks for **${target}**.`;
    styleMandatesXml = `<strategic_directives>
- **Customer Value Proposition**: Explicitly outline the core customer pain points, value hooks, and customer segments.
- **Conversion Metrics**: Define clear business growth funnels (Acquisition, Activation, Retention, Referral, Revenue).
- **MVP Validation**: Design simple, low-cost heuristics to validate market interest before building complex features.
- **Clear Competitor Defensibility**: Detail the startup's unique selling proposition and defensible market advantages.
</strategic_directives>`;
    techHeaderLabel = 'BUSINESS CHANNELS & MARKET VECTOR';
    deliverablesXml = `<deliverables_format>
1.  **Strategic Checklist (task.md at root)**: Outline your planning and drafting steps in markdown before compiling.
2.  **Strategic Playbook & Spec**: Deliver complete specs, user stories, pitch outlines, or campaign scripts. Avoid empty summaries.
3.  **Validation Roadmaps**: List exact metrics, user validation interviews, and analytics tracking criteria to measure success.
</deliverables_format>`;
  } else {
    stylePersona = `acting as an elite, principal **${
      config.toggles.layer === 'ui-only' 
        ? 'Frontend UI Architect' 
        : config.toggles.layer === 'backend-only' 
        ? 'Backend Systems Architect' 
        : 'Full-Stack Software Engineer'
    }** specialized in prompt execution for **${target}** with a focus on writing clean, type-safe, self-documenting code.`;
    styleMandatesXml = `<code_style_mandates>
- **Type Safety**: Avoid using any. Use precise TypeScript schemas, interfaces, and utility types.
- **Defensive Design**: Validate parameters, catch boundary failures, and implement abort timers for API calls.
- **Code Hygiene**: Write single-responsibility functions. Keep lines short, variables descriptive, and comments meaningful.
</code_style_mandates>`;
    techHeaderLabel = 'TECHNOLOGY STACK & UTILITIES';
    deliverablesXml = `<deliverables_format>
1.  **Implementation Checklist (task.md at root)**: Detail your exact development timeline in markdown before implementing any source edits. Update this list as you complete each task.
2.  **Modular Code Deliverables**: Present full, drop-in replacement files. Each file block must be complete with zero placeholders or omissions.
3.  **Verification Steps**: List the exact terminal commands (tests, builds, lints) and manual verification criteria required to guarantee correctness.
</deliverables_format>`;
  }

  // Incorporating extracted knowledge items
  const frameworksHeader = Array.from(new Set(knowledgeEntries.flatMap(k => k.frameworks))).join(', ');

  let environmentHeader = '';
  if (isContentCreator) {
    environmentHeader = `We are executing a creative task within the following environment:
<narrative_channels>
${frameworksHeader || 'Video Script, B-Roll, Narrative Storyboard'}
</narrative_channels>`;
  } else if (isBusinessStartup) {
    environmentHeader = `We are executing a business strategy task within the following environment:
<market_vector>
${frameworksHeader || 'Startup Pitch, Market Spec, Growth Funnel'}
</market_vector>`;
  } else {
    environmentHeader = `We are executing a professional task within the following environment:
<tech_stack>
${frameworksHeader || 'TypeScript, Next.js, Tailwind CSS'}
</tech_stack>`;
  }

  // Format distinct video parameter blocks for local synthesis
  const videoParametersText = knowledgeEntries.map((k, i) => `
### VIDEO PARAMETER #${i + 1}: ${k.videoTitle} (Channel: ${k.channelName || 'YouTube'})
* **Core Thesis**: ${k.main_topic}
* **Principles to Enforce**:
${k.principles.map(p => `  - ${p}`).join('\n') || '  - None specified.'}
* **Lessons & Best Practices**:
${k.lessons.map(l => `  - ${l}`).join('\n') || '  - None specified.'}
* **Critical Traps to Avoid**:
${k.warnings.map(w => `  - ${w}`).join('\n') || '  - None specified.'}
* **Examples & Patterns**:
${k.examples.map(e => `  - ${e}`).join('\n') || '  - None specified.'}
* **Frameworks & Tech**: ${k.frameworks.join(', ') || 'None'}`).join('\n\n');

  const promptText = `# CO-STAR PROMPT SPECIFICATION

## [CONTEXT]
${environmentHeader}

This task incorporates lessons, architectural structures, warnings, and guidelines derived from technical analysis of:
<source_lectures>
${titles}
</source_lectures>

${videoParametersText}

---

## [OBJECTIVE]
Execute a comprehensive **${type}** task conforming to the following scope boundaries:
${strengthGuidance}

<task_guidelines>
${getPromptTypeInstructions(type)}
</task_guidelines>

### Specific Directives:
${checklist.map(item => `- [ ] **${item}**`).join('\n')}
${config.additionalContext ? `- [ ] **Additional Instruction**: ${config.additionalContext}` : ''}

---

## [STYLE]
Act as a principal professional, ${stylePersona}
${styleMandatesXml}

---

## [TONE]
Direct, precise, professional, and authoritative. Avoid conversational introductions or post-implementation small talk. Respond strictly with architectural layouts, drop-in scripts, files, or verification protocols.

---

## [AUDIENCE]
This instruction is fully optimized for **${target}**. Modify your file edits, tool actions, and output packaging to fit the native mechanics of the target agent:
<agent_mechanics>
${agentGuidance}
</agent_mechanics>

---

## [RESPONSE FORMAT]
To ensure successful execution, you must structure your response exactly as follows:
${deliverablesXml}
`;

  return promptText;
}

/**
 * Returns highly detailed, category-specific instructions for the chosen prompt type
 * to ensure that even locally generated offline prompts are rich, contextual, and have "soul".
 */
function getPromptTypeInstructions(type: string): string {
  switch (type) {
    // Software Engineering
    case 'Feature Implementation':
      return `### Technical Feature Implementation Blueprints
- Outline the component-level directory tree showing exact file placements before executing code.
- Establish precise data-flow models and state-management pipelines. Decouple your data-fetching operations from your layout visual rendering.
- Deliver clean TypeScript type definitions for all API models, props, and custom hooks. Avoid using the any type.
- Ensure all logic pathways are fully documented with JSDoc comments mapping inputs, outputs, and side-effects.`;

    case 'Bug Fix':
      return `### Defensive Debugging & Fault Isolation Protocols
- Isolate the source of the issue by systematically tracing database mutations, rendering pipelines, or network responses.
- Implement comprehensive try-catch boundaries, robust parameter validations, and explicit error handlers.
- Add timeout limits and abort controllers to outgoing fetches to prevent infinite loading freezes or application hangs.
- Set up safe fallback views (e.g., Error Boundaries or loading skeleton animations) to ensure a smooth recovery state if a component fails.`;

    case 'Refactor':
      return `### Code Refactoring & Optimization Directives
- Review the existing codebase files to locate redundant imports, tightly coupled components, and duplicated business logics.
- Abstract repetitive utility scripts into pure, highly cohesive, single-responsibility helper modules.
- Implement dry (Don't Repeat Yourself) design patterns. Transition inline states to custom React hooks or clean, central state stores (e.g. Zustand).
- Enforce strict separation of concerns, ensuring layout views do not hold side-effects or network query logics.`;

    case 'UI Improvement':
    case 'UX Improvement':
    case 'Design System':
      return `### Interface, Design System & Layout Enhancement Mandates
- Optimize the layout using premium modern styling systems.
- Visual Hierarchy: Maintain absolute structural alignment using responsive flex/grid layouts.
- Interactive Polish: Inject glassmorphic panels, Tailwind gradient borders, custom focus halos, and smooth linear transition durations.
- Touch Target Accessibility: Ensure touch-friendly controls (minimum 44x44px target sizes) and proper interactive states (hover, focus, active).
- Consistency: Define centralized design tokens (colors, font weights, shadows) and consume them across all components.`;

    case 'Mobile Optimization':
      return `### Mobile Viewport & Touch-First Layout Directives
- Build a responsive interface prioritizing mobile layouts, utilizing adaptive grid structures and collapsible navigation panels.
- Touch Optimization: Enforce larger tap targets (minimum 48x48px), clean swipe layouts, and swipeable gestures.
- Performance: Minimize heavy scripts and image footprints to ensure exceptionally fast loading speeds over 3G/4G connections.
- Collapsible Layouts: Hide advanced elements inside custom slide-out side drawers or drawer overlays for cleaner mobile navigation.`;

    case 'Performance Optimization':
      return `### Performance Tuning & Rendering Optimization Directives
- Isolate rendering bottlenecks by auditing active component structures and tracking heavy dependencies.
- Minimize unnecessary React re-renders using stable state allocations, custom hooks, and memoizations.
- Implement lazy-loading strategies for images, scripts, and heavy modular blocks.
- Leverage browser caching, client-side pagination, and debounced network call triggers.`;

    case 'Accessibility Audit':
      return `### Comprehensive Accessibility (WCAG 2.1 AA) Directives
- Ensure all interactive nodes have descriptive aria labels and correct semantic HTML tags.
- Keyboard Navigation: Enforce clear tab order flow, visible focus outlines, and standard keyboard handler listeners.
- Color Contrast: Guarantee that all text meets strict color contrast ratios (minimum 4.5:1 for normal text).
- Screen Reader Accessibility: Structure visual content sequentially, utilizing clean heading trees (h1 through h6).`;

    case 'Database Schema Design':
      return `### Database Schema Design & Migration Specifications
- Model a highly cohesive database schema with clear constraints (primary keys, foreign keys, not-null).
- Indexing Strategy: Proactively create indexes on foreign keys and frequently queried fields to maximize speed.
- Normalization: Design tables to conform with standard relational rules (third normal form), extracting repeated metrics into dedicated reference entities.
- Scalability: Set up clean migration frameworks that support zero-downtime schema upgrades.`;

    case 'API Integration':
      return `### Robust API Integration & Network Protocols
- Setup clean client modules to handle API queries using structured Axios or Fetch integrations.
- Error Management: Implement centralized response interceptors that process standard error formats, refresh tokens, and log anomalies.
- Type Safety: Map all network payloads through clear, type-safe validation boundaries (Zod or TypeScript types).
- Robust Fallbacks: Provide clear retry policies and safe cached offline fallbacks.`;

    case 'Unit Test Suite Generator':
      return `### Rigorous Test-Driven Development (TDD) Test Suites
- Draft comprehensive unit test specifications mapping out positive, negative, and edge-case boundaries.
- Mocking Strategy: Isolate functions under test by cleanly mocking network calls, database queries, and external APIs.
- Component Verification: Validate rendering states, user input events, and asynchronous resolution pathways.
- Code Coverage: Achieve exceptionally high coverage metrics (minimum 85%) on all core logic layers.`;

    case 'Security Hardening':
      return `### Security Auditing & Code Hardening Standards
- Protect against common security vulnerabilities (XSS, SQL Injection, CSRF, Path Traversal).
- Input Validation: Implement strict validation, sanitization, and encoding on all user inputs.
- Credentials Protection: Enforce strict storage policies, preventing environment variables or sensitive tokens from leaking to logs or client-side assets.
- Dependency Auditing: Locate and upgrade vulnerable packages, substituting fragile components with robust modules.`;

    case 'DevOps & CI/CD Pipeline':
      return `### DevOps Infrastructure & Build pipeline Blueprints
- Set up standard CI/CD workflow configurations (e.g. GitHub Actions, GitLab CI) checking builds, lints, and test suites.
- Containerization: Draft highly optimized Dockerfiles utilizing multi-stage builds to minimize image sizes.
- Infrastructure: Outline declarative Terraform or cloud configurations specifying isolated compute, database, and network boundaries.
- Logging: Configure standard health endpoints and performance metrics dashboards.`;

    // Content Creation
    case 'News Video Script Creator':
      return `### Creative Objective for Broadcast Journalism
- Transform the source story into a professional broadcast-ready news video script.
- Structure the narrative using standard news formatting:
  - **Visual A-Roll/B-Roll Cues**: Explicitly describe visual cuts, on-screen text graphics, lower-third overlays, and archival footage in square brackets.
  - **Audio/Music Cues**: Define sound effects (SFX) and background music (BGM) shifts to pace the drama.
  - **Role Splits**: Provide clear, engaging speaking blocks for an Anchor (introducing the news), a Reporter (on-scene investigation), and an Expert/Eyewitness (interviews).
- Pacing Mandate: Visual graphics or scene cuts must change every 5 to 7 seconds to maximize audience retention. Include a high-impact hook in the first 5 seconds to summarize the headline.`;

    case 'Story Adaptation & Recreation':
      return `### Narrative Adaptation Methodology
- Re-imagine, adapt, and recreate the source story elements into a completely new adapted format (e.g. screenplay, novel scene, or dialogue).
- Establish a compelling three-act narrative structure:
  - **Act 1 (Setup & Hook)**: Immediately establish the characters, mood, and central conflict.
  - **Act 2 (Confrontation & Pacing)**: Build the tension through highly expressive character interactions, natural subtextual dialogue, and descriptive sensory prose.
  - **Act 3 (Resolution)**: Conclude with a satisfying dramatic beat that ties together the central theme.
- Character Voices: Give each character a distinct voice, subtext, and mannerisms. Avoid passive summaries or shorthand narration.`;

    case 'YouTube Video Script':
      return `### YouTube Video Script & Retention Blueprint
- Craft an engaging, educational video script optimized for video formats.
- Retainer Hook: Draft a hyper-engaging first 15 seconds outlining the exact value payoff the viewer will receive.
- Structure: Build a logical flow segmenting topics into clear chapters, transitioning smoothly between steps.
- B-Roll annotations: Embed exact cues for secondary video tracks, screen zooming, graphics, and text overlays in brackets.
- Call to Action (CTA): Conclude with a natural, conversion-focused prompt to subscribe, comment, or explore resources.`;

    case 'Technical Blog Post Writer':
      return `### High-Quality Technical Blog Post Structure
- Write a compelling, educational, and developer-friendly technical article based on the video context.
- Outline: Structure using clear markdown headings (H2, H3), bullet points, and clean syntax-highlighted code blocks.
- Style: Informative, concise, authoritative, engaging. Avoid marketing jargon or clickbait headlines.
- Key Takeaways: Summarize core technical lessons in clean takeaway cards at the beginning.
- Call to Action: Conclude with next steps, reading recommendations, or project prompts.`;

    case 'Social Media Content Pack':
      return `### Viral Social Media Campaign & Writing Guidelines
- Convert the core lessons into a coordinated social media content package:
  - **LinkedIn Post**: In-depth, professional case-study outline detailing concrete metrics, steps, and takeaways. Keep spacing clean.
  - **X/Twitter Thread**: A high-impact thread (5-8 tweets) starting with a scroll-stopping hook, breaking down key insights into distinct tweets, and ending with a resources CTA.
  - **TikTok/Shorts Script**: A visual script (under 60s) with hook, rapid pacing notes, and direct voiceover directives.`;

    case 'Podcast Outline & Script':
      return `### Podcast Episode Blueprint & Conversation Flow
- Draft a highly engaging podcast outline for a host and co-host.
- Hook: Start with a dynamic introduction discussing the relevance of the video topic.
- Show Segments: Divide the podcast into 3 clear thematic segments, mapping conversational prompts and speaker points.
- Discussion Prompts: Write open-ended questions that provoke debate, analysis, and storytelling.
- Closing: Conclude with sponsor check-ins, episode highlights, and audience calls-to-action.`;

    case 'Interactive Storyboard':
      return `### Interactive Storyboard & User Flow Diagrams
- Map out a sequential storytelling timeline illustrating visual transitions and user decision nodes.
- Scene Beats: Define exact visual layouts, speaker narrations, and audio backgrounds.
- Decision Nodes: Map out interactive choices where a user or viewer branches the story, explaining the consequences of each choice.
- Asset Lists: Compile complete visual asset lists required for each scene (images, characters, backgrounds).`;

    // Startup & Marketing
    case 'Startup MVP Spec':
      return `### Business Specification & MVP Validation Playbook
- Compile a high-value Product Requirements Document (PRD) specifying the leanest viable version of the product.
- User Stories: Detail exact user stories using the standard template: "As a [User], I want to [Action], so that [Benefit]."
- Core Metric Funnels: Establish concrete, easy-to-measure Pirate Metrics (AARRR) to track user activation, retention, and conversion.
- Low-Cost Validation: Define concrete heuristics to test value propositions using simple landing pages, mock forms, or manual spreadsheet operators before building databases.`;

    case 'SaaS Pitch Deck Outline':
      return `### SaaS Pitch Deck Outline & Venture Capital Narrative
- Structure a highly persuasive, 10-slide pitch deck blueprint targeted at venture capital investors:
  - **The Hook (Problem/Solution)**: Articulate the massive market pain and your product's unique resolution.
  - **Market Opportunity**: Present concrete addressable market sizes (TAM, SAM, SOM) and growth vectors.
  - **Product & Traction**: Detail existing customer milestones, product features, and business growth rates.
  - **Business Model**: Map out clear pricing plans, cost metrics (LTV, CAC), and expansion goals.
- Tone: Extremely authoritative, growth-oriented, and financially literate.`;

    case 'Go-To-Market Plan':
      return `### SaaS Go-To-Market (GTM) Launch Playbook
- Build a comprehensive, phased launch plan to bring the product to market.
- Audience Profiling: Define standard Ideal Customer Profiles (ICPs) and buyer personas.
- Marketing Mix: Outline direct user acquisition channels (Organic SEO, Referral marketing, Paid advertising).
- Launch Timeline: Divide steps into Pre-Launch (building email lists), Soft Launch (beta cohorts), and Hard Public Launch.
- Feedback Loops: Setup customer feedback cycles to measure early Net Promoter Scores (NPS).`;

    case 'Marketing Campaign Strategy':
      return `### Multi-Channel Marketing Campaign Strategy
- Design a comprehensive growth campaign targeting customer acquisition.
- Campaign Concept: Define the central creative hook and theme of the campaign.
- Channel Distribution: Map out marketing coordinates across SEO, content syndications, paid ads, and social media.
- Pacing & Timelines: Outline a 30-day campaign calendar detailing exact assets required.
- Tracking & Analytics: Define precise conversion tracking boundaries, mapping UTM codes and analytics coordinates.`;

    case 'SEO Article Outline':
      return `### Semantic Search & High-Ranking SEO Outline
- Outline a highly comprehensive, search-optimized article targeting premium keywords.
- Heading Hierarchy: Model H2 and H3 headings matching semantic user search intents.
- Content Directives: Specify key search terms, semantic synonyms, and answers to include under each section.
- Internal/External Linking: Recommend linking architectures and high-authority reference anchors.
- Meta Fields: Draft scroll-stopping title tags and high-retention meta descriptions.`;

    case 'Customer Support Playbook':
      return `### Professional Customer Support Playbook & Help Center
- Build a standardized customer support handbook mapping user issues to clean, empathy-driven canned resolutions.
- Empathy Standards: Enforce active listening frameworks, positive phrasing constraints, and transparent timelines.
- Escalation Pathways: Detail exact steps to escalate technical issues from Level 1 Support to Engineering leads.
- Help Center FAQs: Write highly readable, step-by-step resolution guides for common customer self-service paths.`;

    default:
      return `### Core Objective Specifications
- Define a structured execution pipeline that solves the target requirements systematically.
- Maintain absolute quality parameters, robust validation criteria, and self-documenting outputs.`;
  }
}

