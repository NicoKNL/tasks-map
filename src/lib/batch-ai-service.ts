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

    // Use the new multiple tasks prediction for breadth
    try {
      const results = await AIService.predictMultipleNextTasks({
        currentTask,
        relatedTasks,
        settings,
        maxTasks: count
      });

      // Ensure we don't exceed count
      return results.slice(0, count);
    } catch (error) {
      console.error("AI multiple next tasks prediction failed:", error);
      // Fallback to sequential generation if multiple prediction fails
      console.log("Falling back to sequential generation");
      return this.predictBatchTasksSequential(request);
    }
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

    // Use the new multiple tasks prediction for breadth
    try {
      const results = await AIService.predictMultiplePreviousTasks({
        currentTask,
        relatedTasks,
        settings,
        maxTasks: count
      });

      // Ensure we don't exceed count
      return results.slice(0, count);
    } catch (error) {
      console.error("AI multiple previous tasks prediction failed:", error);
      // Fallback to sequential generation if multiple prediction fails
      console.log("Falling back to sequential generation");
      return this.predictBatchPreviousTasksSequential(request);
    }
  }

  /**
   * Fallback: sequential generation of next tasks (original implementation)
   */
  private static async predictBatchTasksSequential(request: BatchPredictionRequest): Promise<string[]> {
    const { currentTask, relatedTasks, settings, count } = request;
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
   * Fallback: sequential generation of previous tasks (original implementation)
   */
  private static async predictBatchPreviousTasksSequential(request: BatchPredictionRequest): Promise<string[]> {
    const { currentTask, relatedTasks, settings, count } = request;
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
