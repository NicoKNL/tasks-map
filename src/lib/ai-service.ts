import { Notice } from "obsidian";
import { TasksMapSettings } from "../types/settings";

export interface AIPredictionRequest {
  currentTask: string;
  relatedTasks: string[];
  settings: TasksMapSettings;
}

export class AIService {
  /**
   * Predict the next task based on current task and related tasks
   */
  static async predictNextTask(request: AIPredictionRequest): Promise<string> {
    const { currentTask, relatedTasks, settings } = request;
    
    if (!settings.aiEnabled) {
      throw new Error("AI integration is not enabled");
    }
    
    if (!settings.aiApiKey.trim()) {
      throw new Error("API key is required");
    }
    
    // Construct prompt from template
    const prompt = this.constructPrompt(currentTask, relatedTasks, settings.aiPrompt);
    
    try {
      let result: string;
      switch (settings.aiProvider) {
        case "openai":
          result = await this.callOpenAI(prompt, settings);
          break;
        case "anthropic":
          result = await this.callAnthropic(prompt, settings);
          break;
        case "gemini":
          result = await this.callGemini(prompt, settings);
          break;
        case "custom":
          result = await this.callCustomAPI(prompt, settings);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${settings.aiProvider}`);
      }
      
      // Clean up the response
      return this.cleanResponse(result);
    } catch (error) {
      console.error("AI prediction failed:", error);
      throw error;
    }
  }
  
  private static constructPrompt(currentTask: string, relatedTasks: string[], template: string): string {
    // Replace placeholders in the template
    let prompt = template.replace(/{currentTask}/g, currentTask);
    
    const relatedTasksText = relatedTasks.map((task, index) => `- ${task}`).join("\n");
    prompt = prompt.replace(/{relatedTasks}/g, relatedTasksText);
    
    return prompt;
  }
  
  private static async callOpenAI(prompt: string, settings: TasksMapSettings): Promise<string> {
    const url = settings.aiBaseUrl.trim() || "https://api.openai.com/v1";
    const endpoint = `${url}/chat/completions`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || "";
  }
  
  private static async callAnthropic(prompt: string, settings: TasksMapSettings): Promise<string> {
    const url = settings.aiBaseUrl.trim() || "https://api.anthropic.com/v1";
    const endpoint = `${url}/messages`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.aiApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: settings.aiModel,
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data.content[0]?.text?.trim() || "";
  }
  
  private static async callGemini(prompt: string, settings: TasksMapSettings): Promise<string> {
    const url = settings.aiBaseUrl.trim() || "https://generativelanguage.googleapis.com/v1beta";
    const model = settings.aiModel;
    const endpoint = `${url}/models/${model}:generateContent?key=${settings.aiApiKey}`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }
  
  private static async callCustomAPI(prompt: string, settings: TasksMapSettings): Promise<string> {
    // For custom providers, assume OpenAI-compatible API
    const url = settings.aiBaseUrl.trim();
    if (!url) {
      throw new Error("Base URL is required for custom provider");
    }
    
    // Check if URL ends with /v1, if not, append /v1/chat/completions
    let endpoint = url;
    if (!url.endsWith("/chat/completions")) {
      endpoint = url.endsWith("/v1") ? `${url}/chat/completions` : `${url}/v1/chat/completions`;
    }
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    // Try to extract content from various response formats
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    } else if (data.content?.[0]?.text) {
      return data.content[0].text.trim();
    } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    } else if (data.text) {
      return data.text.trim();
    } else {
      throw new Error("Unexpected API response format");
    }
  }
  
  private static cleanResponse(response: string): string {
    // Remove markdown formatting, numbering, etc.
    // Remove leading/trailing quotes
    let cleaned = response.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
    
    // Remove bullet points, numbering
    cleaned = cleaned.replace(/^[-*•]\s*/gm, "");
    cleaned = cleaned.replace(/^\d+\.\s*/gm, "");
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\n\s*\n/g, "\n").trim();
    
    // Limit length (just in case)
    if (cleaned.length > 1000) {
      cleaned = cleaned.substring(0, 1000) + "...";
    }
    
    return cleaned;
  }
}