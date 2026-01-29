import api from '../utils/api';
import { AISummary, WorkItem } from '../types';

export const aiService = {
  async generateSummaryForManager(): Promise<AISummary> {
    const response = await api.post<{ summary: AISummary }>('/ai/summary');
    return response.data.summary;
  },

  /**
   * Generate a summary from all open work items (fetched by backend)
   * @returns A string summary of the work items
   */
  async generateSummaryFromBackend(): Promise<string> {
    const response = await api.post<{ summary: string }>('/ai/summary');
    return response.data.summary;
  },

  async getSummaries(): Promise<AISummary[]> {
    const response = await api.get<{ summaries: AISummary[] }>('/ai/summaries');
    return response.data.summaries;
  },

  /**
   * Generate a summary from an array of work items
   * @param workItems Array of WorkItem objects to summarize
   * @returns A string summary of the work items
   */
  async generateSummary(workItems: WorkItem[]): Promise<string> {
    const response = await api.post<{ summary: string }>('/ai/summarize', { workItems });
    return response.data.summary;
  },
};
