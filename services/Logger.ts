
import { GoogleGenAI } from "@google/genai";
import { APP_METRICS } from "../config";

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'METRIC';
  message: string;
  metadata?: any;
  duration?: number;
}

class TelemetryService {
  private logs: LogEntry[] = [];

  log(level: LogEntry['level'], message: string, metadata?: any, duration?: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      duration
    };
    
    this.logs.unshift(entry);
    if (this.logs.length > APP_METRICS.LOG_RETENTION_COUNT) {
      this.logs.pop();
    }

    // Also log to console for local debugging
    const color = level === 'ERROR' ? 'color: red' : level === 'METRIC' ? 'color: cyan' : 'color: gray';
    console.log(`%c[${level}] ${message}`, color, metadata || '');
  }

  getRecentLogs() {
    return this.logs;
  }

  async getAIInsights() {
    try {
      const logSummary = this.logs
        .slice(0, 20)
        .map(l => `[${l.level}] ${l.message} (${l.duration || 0}ms)`)
        .join('\n');

      // Initialize GenAI inside the method to ensure fresh API key usage
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these application logs and provide a concise summary of system health and any technical challenges found. Format as a brief bulleted list for a system admin: \n\n${logSummary}`,
      });

      return response.text;
    } catch (e) {
      return "Unable to generate AI insights at this moment.";
    }
  }
}

export const Logger = new TelemetryService();
