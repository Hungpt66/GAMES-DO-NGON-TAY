export type QuestionType = 'multiple_choice' | 'short_answer';

export interface Question {
  id: string;
  type: QuestionType;
  category: string; // e.g. "Giao việc & Ủy quyền", "Phản hồi & Động lực", "Xử lý xung đột"
  question: string;
  imageUrl?: string;
  // For multiple choice
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string; // Giải thích ý nghĩa quản trị
  timeLimitSeconds?: number; // mặc định 30s
  points?: number; // mặc định 10 điểm
}

export interface UserAnswer {
  questionId: string;
  selectedOption?: 'A' | 'B' | 'C' | 'D';
  shortAnswerText?: string;
  isCorrect?: boolean;
  timeSpentSeconds: number;
  // Instructor manual review
  instructorScore?: number;
  instructorFeedback?: string;
}

export interface GameSession {
  id: string;
  playerName: string;
  department: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  answers: UserAnswer[];
  questionsSnapshot: Question[];
}

export interface SoundConfig {
  soundEnabled: boolean;
  volume: number;
  correctSoundType: 'synth_bright' | 'synth_bell' | 'custom';
  wrongSoundType: 'synth_gentle' | 'synth_buzz' | 'custom';
  victorySoundType: 'fanfare' | 'custom';
  customCorrectUrl?: string;
  customWrongUrl?: string;
  customVictoryUrl?: string;
}
