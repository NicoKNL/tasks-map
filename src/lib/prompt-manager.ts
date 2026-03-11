import { Language } from "../i18n";
import type { TasksMapSettings } from "../types/settings";

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: string;
}

export class PromptManager {
  /**
   * Get system prompt for next task prediction based on user's language
   */
  static getSystemPromptForNext(language: Language): string {
    const prompts: Record<Language, string> = {
      en: `You are an AI assistant that helps predict task relationships.

CRITICAL INSTRUCTIONS:
1. Respond EXCLUSIVELY in the user's detected language
2. Generate ONLY the task description
3. Do NOT include any other task properties
4. Do NOT include markdown formatting, numbering, or additional explanations
5. Keep responses concise and focused on the task itself

Your role is to analyze the current task and related tasks, then predict the next logical task that follows in the workflow.`,
      nl: `Je bent een AI-assistent die helpt bij het voorspellen van taakrelaties.

KRITIEKE INSTRUCTIES:
1. Reageer EXCLUSIEF in de taal van de gebruiker
2. Genereer ALLEN de taakbeschrijving
3. Neem GEEN andere taak-eigenschappen op
4. Geen opmaak, nummering of extra uitleg toevoegen
5. Houd reacties bondig en gericht op de taak zelf

Je rol is om de huidige taak en gerelateerde taken te analyseren en de volgende logische taak in de workflow te voorspellen.`,
      "zh-CN": `你是一个在Obsidian中，帮助预测任务关系，并且创建tasks任务的 AI 助手。

关键指令：
1. 仅使用用户使用的语言回复
2. 仅生成任务描述
3. 不包含其他任务属性
4. 不包含 Markdown 格式、编号或额外解释
5. 保持回答简洁，专注于任务本身

你的角色是分析当前任务和相关任务，然后预测工作流程中下一个逻辑任务。
`
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Get system prompt for previous task prediction based on user's language
   */
  static getSystemPromptForPrevious(language: Language): string {
    const prompts: Record<Language, string> = {
      en: `You are an AI assistant that helps predict task relationships.

CRITICAL INSTRUCTIONS:
1. Respond EXCLUSIVELY in the user's detected language
2. Generate ONLY the task description
3. Do NOT include any other task properties
4. Do NOT include markdown formatting, numbering, or additional explanations
5. Keep responses concise and focused on the task itself

Your role is to analyze the current task and related tasks, then predict the previous logical task that precedes in the workflow.`,
      nl: `Je bent een AI-assistent die helpt bij het voorspellen van taakrelaties.

KRITIEKE INSTRUCTIES:
1. Reageer EXCLUSIEF in de taal van de gebruiker
2. Genereer ALLEN de taakbeschrijving
3. Neem GEEN andere taak-eigenschappen op
4. Geen opmaak, nummering of extra uitleg toevoegen
5. Houd reacties bondig en gericht op de taak zelf

Je rol is om de huidige taak en gerelateerde taken te analyseren en de vorige logische taak in de workflow te voorspellen.`,
      "zh-CN": `你是一个在Obsidian中，帮助预测任务关系，并且创建tasks任务的 AI 助手。

关键指令：
1. 仅使用用户使用的语言回复
2. 仅生成任务描述
3. 不包含其他任务属性
4. 不包含 Markdown 格式、编号或额外解释
5. 保持回答简洁，专注于任务本身

你的角色是分析当前任务和相关任务，然后预测工作流程中上一个逻辑任务。
`
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Get complete prompt for predicting next task
   */
  static getNextTaskPrompt(
    currentTask: string,
    relatedTasks: string[],
    language: Language,
    userAdditionalReqs: string = ""
  ): string {
    const systemPrompt = this.getSystemPromptForNext(language);

    const userPrompt = `
Current task: ${currentTask}

Related tasks:
${relatedTasks.map(task => `- ${task}`).join('\n')}

Next task:`;

    // Combine system prompt, user's additional requirements, and context
    return `${systemPrompt}\n\n${userAdditionalReqs ? userAdditionalReqs + '\n\n' : ''}${userPrompt}`;
  }

  /**
   * Get complete prompt for predicting previous task
   */
  static getPreviousTaskPrompt(
    currentTask: string,
    relatedTasks: string[],
    language: Language,
    userAdditionalReqs: string = ""
  ): string {
    const systemPrompt = this.getSystemPromptForPrevious(language);

    const userPrompt = `
Current task: ${currentTask}

Related tasks:
${relatedTasks.map(task => `- ${task}`).join('\n')}

Previous task:`;

    // Combine system prompt, user's additional requirements, and context
    return `${systemPrompt}\n\n${userAdditionalReqs ? userAdditionalReqs + '\n\n' : ''}${userPrompt}`;
  }

  /**
   * Get system prompt for multiple next tasks prediction based on user's language
   */
  static getSystemPromptForMultipleNext(language: Language): string {
    const prompts: Record<Language, string> = {
      en: `You are an AI assistant that helps predict task relationships.

CRITICAL INSTRUCTIONS:
1. Respond EXCLUSIVELY in the user's detected language
2. Generate ONLY task descriptions
3. Do NOT include any other task properties
4. Do NOT include markdown formatting, numbering, or additional explanations
5. Keep responses concise and focused on the tasks themselves
6. Generate multiple possible next tasks that could follow the current task.

Your role is to analyze the current task and related tasks, then predict multiple possible next logical tasks that could follow in the workflow. These tasks could be parallel (can be done simultaneously) or sequential (one after another).`,
      nl: `Je bent een AI-assistent die helpt bij het voorspellen van taakrelaties.

KRITIEKE INSTRUCTIES:
1. Reageer EXCLUSIEF in de taal van de gebruiker
2. Genereer ALLEN taakbeschrijvingen
3. Neem GEEN andere taak-eigenschappen op
4. Geen opmaak, nummering of extra uitleg toevoegen
5. Houd reacties bondig en gericht op de taken zelf
6. Genereer meerdere mogelijke volgende taken die kunnen volgen op de huidige taak.

Je rol is om de huidige taak en gerelateerde taken te analyseren en meerdere mogelijke volgende logische taken te voorspellen die in de workflow kunnen volgen. Deze taken kunnen parallel (gelijktijdig uitgevoerd) of sequentieel (een na de ander) zijn.`,
      "zh-CN": `你是一个在Obsidian中，帮助预测任务关系，并且创建tasks任务的 AI 助手。

关键指令：
1. 仅使用用户使用的语言回复
2. 仅生成任务描述
3. 不包含其他任务属性
4. 不包含 Markdown 格式、编号或额外解释
5. 保持回答简洁，专注于任务本身
6. 生成多个可能的后续任务，这些任务可以跟随当前任务。

你的角色是分析当前任务和相关任务，然后预测工作流程中多个可能的下一个逻辑任务。这些任务可以是并行的（可以同时进行）或顺序的（一个接一个）。`
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Get system prompt for multiple previous tasks prediction based on user's language
   */
  static getSystemPromptForMultiplePrevious(language: Language): string {
    const prompts: Record<Language, string> = {
      en: `You are an AI assistant that helps predict task relationships.

CRITICAL INSTRUCTIONS:
1. Respond EXCLUSIVELY in the user's detected language
2. Generate ONLY task descriptions
3. Do NOT include any other task properties
4. Do NOT include markdown formatting, numbering, or additional explanations
5. Keep responses concise and focused on the tasks themselves
6. Generate multiple possible previous tasks that could precede the current task.

Your role is to analyze the current task and related tasks, then predict multiple possible previous logical tasks that could precede in the workflow. These tasks could be parallel (could have been done simultaneously) or sequential (one before another).`,
      nl: `Je bent een AI-assistent die helpt bij het voorspellen van taakrelaties.

KRITIEKE INSTRUCTIES:
1. Reageer EXCLUSIEF in de taal van de gebruiker
2. Genereer ALLEN taakbeschrijvingen
3. Neem GEEN andere taak-eigenschappen op
4. Geen opmaak, nummering of extra uitleg toevoegen
5. Houd reacties bondig en gericht op de taken zelf
6. Genereer meerdere mogelijke vorige taken die kunnen voorafgaan aan de huidige taak.

Je rol is om de huidige taak en gerelateerde taken te analyseren en meerdere mogelijke vorige logische taken te voorspellen die in de workflow kunnen voorafgaan. Deze taken kunnen parallel (gelijktijdig uitgevoerd) of sequentieel (een na de ander) zijn.`,
      "zh-CN": `你是一个在Obsidian中，帮助预测任务关系，并且创建tasks任务的 AI 助手。

关键指令：
1. 仅使用用户使用的语言回复
2. 仅生成任务描述
3. 不包含其他任务属性
4. 不包含 Markdown 格式、编号或额外解释
5. 保持回答简洁，专注于任务本身
6. 生成多个可能的前置任务，这些任务可以在当前任务之前。

你的角色是分析当前任务和相关任务，然后预测工作流程中多个可能的上一个逻辑任务。这些任务可以是并行的（可以同时进行）或顺序的（一个接一个）。`
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Get complete prompt for predicting multiple next tasks
   */
  static getMultipleNextTasksPrompt(
    currentTask: string,
    relatedTasks: string[],
    language: Language,
    userAdditionalReqs: string = "",
    maxTasks: number = 5
  ): string {
    const systemPrompt = this.getSystemPromptForMultipleNext(language);

    const userPrompt = `
Current task: ${currentTask}

Related tasks:
${relatedTasks.map(task => `- ${task}`).join('\n')}

Please generate up to ${maxTasks} possible next tasks. Each task should be on a separate line.

Important: For each task, you may prefix it with "S:" (sequential) or "P:" (parallel) to indicate the relationship with the current task and other tasks. Sequential tasks form a chain where each depends on the previous one. Parallel tasks are independent and can be done concurrently. If no prefix is provided, tasks will be treated as parallel.

Focus on generating meaningful tasks.`;

    // Combine system prompt, user's additional requirements, and context
    return `${systemPrompt}\n\n${userAdditionalReqs ? userAdditionalReqs + '\n\n' : ''}${userPrompt}`;
  }

  /**
   * Get complete prompt for predicting multiple previous tasks
   */
  static getMultiplePreviousTasksPrompt(
    currentTask: string,
    relatedTasks: string[],
    language: Language,
    userAdditionalReqs: string = "",
    maxTasks: number = 5
  ): string {
    const systemPrompt = this.getSystemPromptForMultiplePrevious(language);

    const userPrompt = `
Current task: ${currentTask}

Related tasks:
${relatedTasks.map(task => `- ${task}`).join('\n')}

Please generate up to ${maxTasks} possible previous tasks. Each task should be on a separate line.

Important: For each task, you may prefix it with "S:" (sequential) or "P:" (parallel) to indicate the relationship with the current task and other tasks. Sequential tasks form a chain where each depends on the previous one. Parallel tasks are independent and can be done concurrently. If no prefix is provided, tasks will be treated as parallel.

Focus on generating meaningful tasks.`;

    // Combine system prompt, user's additional requirements, and context
    return `${systemPrompt}\n\n${userAdditionalReqs ? userAdditionalReqs + '\n\n' : ''}${userPrompt}`;
  }

  /**
   * Get user's additional requirements from settings
   * These are optional requirements that the user can customize
   */
  static getUserAdditionalReqs(settings: TasksMapSettings): string {
    // User's additional requirements should be minimal and optional
    // Current implementation: from settings, without hardcoded format requirements
    return settings.aiPrompt.trim();
  }

  /**
   * Get user's additional requirements for previous task prediction
   */
  static getUserPreviousAdditionalReqs(settings: TasksMapSettings): string {
    return settings.aiBeforePrompt.trim();
  }

  /**
   * Method to check if user has provided additional requirements
   */
  static hasUserAdditionalReqs(settings: TasksMapSettings): boolean {
    return settings.aiPrompt.trim().length > 0 || 
           settings.aiBeforePrompt.trim().length > 0;
  }
}
