import { AIService, AIPredictionRequest } from "./ai-service";
import { TasksMapSettings } from "../types/settings";

export interface BatchPredictionRequest extends AIPredictionRequest {
  count: number;
}

export class BatchAIService {
  /**
   * Predict multiple next tasks in a batch
   * Each prediction uses the previous task as context for the next one
   */
  static async predictBatchTasks(request: BatchPredictionRequest): Promise<string[]> {
    const { currentTask, relatedTasks, settings, count } = request;
    
    if (count <= 1) {
      // If count is 1 or less, just use the regular AIService
      const result = await AIService.predictNextTask({
        currentTask,
        relatedTasks,
        settings
      });
      return [result];
    }

    const results: string[] = [];
    let lastTask = currentTask;
    let lastRelatedTasks = [...relatedTasks];

    for (let i = 0; i < count; i++) {
      try {
        const nextTask = await AIService.predictNextTask({
          currentTask: lastTask,
          relatedTasks: lastRelatedTasks,
          settings
        });

        if (!nextTask.trim()) {
          console.warn(`AI returned empty response for task ${i + 1}`);
          break;
        }

        results.push(nextTask);

        // Update context for next prediction
        lastTask = nextTask;
        lastRelatedTasks = [...lastRelatedTasks, nextTask];
      } catch (error) {
        console.error(`Failed to predict task ${i + 1}:`, error);
        // If we have some results, return them; otherwise throw error
        if (results.length === 0) {
          throw error;
        }
        break;
      }
    }

    return results;
  }

  /**
   * Predict multiple previous tasks in a batch
   * Each prediction uses the previous task as context for the next one
   */
  static async predictBatchPreviousTasks(request: BatchPredictionRequest): Promise<string[]> {
    const { currentTask, relatedTasks, settings, count } = request;
    
    if (count <= 1) {
      // If count is 1 or less, use the regular AIService
      const result = await AIService.predictPreviousTask({
        currentTask,
        relatedTasks,
        settings
      });
      return [result];
    }

    const results: string[] = [];
    let lastTask = currentTask;
    let lastRelatedTasks = [...relatedTasks];

    for (let i = 0; i < count; i++) {
      try {
        const previousTask = await AIService.predictPreviousTask({
          currentTask: lastTask,
          relatedTasks: lastRelatedTasks,
          settings
        });

        if (!previousTask.trim()) {
          console.warn(`AI returned empty response for previous task ${i + 1}`);
          break;
        }

        results.push(previousTask);

        // Update context for next prediction
        // For previous tasks, we add the predicted task at the beginning
        lastTask = previousTask;
        lastRelatedTasks = [previousTask, ...lastRelatedTasks];
      } catch (error) {
        console.error(`Failed to predict previous task ${i + 1}:`, error);
        if (results.length === 0) {
          throw error;
        }
        break;
      }
    }

    return results;
  }
}