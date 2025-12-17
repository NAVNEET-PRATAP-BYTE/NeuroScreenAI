export interface Question {
  id: number;
  question: string;
  expectedType: string;
}

export interface EvaluationResult {
  score: number; // 0-10
  accuracy: number; // 0-1
  coherence: number; // 0-1
  confidence: number; // 0-1
  concerns: string[];
  analysis: string;
}

export interface EmotionDataPoint {
  timestamp: number;
  stress: number; // 0-1
  anxiety: number; // 0-1
  neutral: number; // 0-1
}

export interface TestSession {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, {
    transcript: string;
    evaluation: EvaluationResult;
    audioFeatures: AudioFeatures;
  }>;
  emotionTimeline: EmotionDataPoint[];
  startTime: number;
}

export interface AudioFeatures {
  pitch: number;
  tone: string;
  stopperWordCount: number;
  aggression: number;
}

export enum AppStage {
  LANDING = 'LANDING',
  PERMISSIONS = 'PERMISSIONS',
  TESTING = 'TESTING',
  PROCESSING = 'PROCESSING',
  RESULTS = 'RESULTS'
}
