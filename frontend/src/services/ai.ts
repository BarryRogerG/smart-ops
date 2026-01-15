import api from '../utils/api';
import { AISummary } from '../types';

export const aiService = {
  async generateSummary(): Promise<AISummary> {
    const response = await api.post<{ summary: AISummary }>('/ai/summary');
    return response.data.summary;
  },

  async getSummaries(): Promise<AISummary[]> {
    const response = await api.get<{ summaries: AISummary[] }>('/ai/summaries');
    return response.data.summaries;
  },
};
