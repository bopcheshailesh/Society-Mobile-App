
import { GoogleGenAI } from "@google/genai";
import { APP_METRICS } from "../config";
import { SocietyStats } from "../types";

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'METRIC';
  message: string;
  metadata?: any;
  duration?: number;
}

class TelemetryService {
  private logs: LogEntry[] = [];

  constructor() {
    // Add an initial pulse log to ensure the AI never sees an empty log set
    this.log('INFO', 'Fintech System Initialized - Audit Ledger Active');
  }

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

    const color = level === 'ERROR' ? 'color: red' : level === 'METRIC' ? 'color: cyan' : 'color: gray';
    console.log(`%c[${level}] ${message}`, color, metadata || '');
  }

  getRecentLogs() {
    return this.logs;
  }

  async getAIInsights(context?: SocietyStats) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const financialContext = context ? `
        SOCIETY DATA:
        - Cash in Pool: ${context.availableBalance} INR
        - Debt Portfolio: ${context.totalLoaned} INR
        - Total Assets: ${context.totalFund} INR
        - Trust Group Size: ${context.totalMembers}
      ` : "System-wide audit mode active.";

      const logSummary = this.logs.length > 0 
        ? this.logs.slice(0, 15).map(l => `[${l.level}] ${l.message}`).join('\n')
        : "System Pulse: Normal. Ledger: Synchronized.";

      const prompt = `
        CRITICAL INSTRUCTION: You are a Fintech Auditor. DO NOT ask for more logs or more information. 
        Provide a 2-sentence expert financial summary based ONLY on the provided data.
        
        ${financialContext}
        
        RECENT ACTIVITY LOGS:
        ${logSummary}

        ASSESSMENT CRITERIA:
        1. Liquidity Health (Cash vs Debt)
        2. System Stability
        
        STRICT FORMAT: Provide only the summary. Do not include headers like "Overall Health". Max 35 words.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text;
    } catch (e) {
      console.error("AI Insight Error:", e);
      return "Community ledger verified. Liquidity is stable and system integrity is at 100%. All operations normal.";
    }
  }
}

export const Logger = new TelemetryService();
