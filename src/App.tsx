import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminScreen } from './components/AdminScreen';
import { Question, UserAnswer, GameSession } from './types';
import { INITIAL_QUESTIONS } from './data/initialQuestions';

const STORAGE_KEY_QUESTIONS = 'leader_quiz_questions_v1';
const STORAGE_KEY_SESSIONS = 'leader_quiz_sessions_v1';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'game' | 'result' | 'admin'>('home');

  // Load questions from localStorage or default
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved questions:', e);
    }
    return INITIAL_QUESTIONS;
  });

  // Load completed sessions
  const [sessions, setSessions] = useState<GameSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved sessions:', e);
    }
    return [];
  });

  // Current Game State
  const [playerName, setPlayerName] = useState<string>('Nguyễn Văn An');
  const [department, setDepartment] = useState<string>('Khối Quản Lý Vận Hành');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentAnswers, setCurrentAnswers] = useState<UserAnswer[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [latestSession, setLatestSession] = useState<GameSession | null>(null);

  // Save questions when changed
  const handleUpdateQuestions = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(newQuestions));
    } catch (e) {
      console.error('Failed to persist questions:', e);
    }
  };

  // Save sessions when changed
  const handleUpdateSessions = (newSessions: GameSession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(newSessions));
    } catch (e) {
      console.error('Failed to persist sessions:', e);
    }
  };

  // Start a new game
  const handleStartGame = (name: string, dept: string) => {
    setPlayerName(name);
    setDepartment(dept);
    setCurrentQuestionIndex(0);
    setCurrentAnswers([]);
    setTotalScore(0);
    setLatestSession(null);
    setCurrentScreen('game');
  };

  // Record an answer
  const handleAnswerSubmitted = (answer: UserAnswer) => {
    // Add or update answer
    const existingIndex = currentAnswers.findIndex((a) => a.questionId === answer.questionId);
    let updatedAnswers: UserAnswer[];

    if (existingIndex >= 0) {
      updatedAnswers = [...currentAnswers];
      updatedAnswers[existingIndex] = answer;
    } else {
      updatedAnswers = [...currentAnswers, answer];
    }
    setCurrentAnswers(updatedAnswers);

    // Recalculate score from multiple choice answers
    let newScore = 0;
    updatedAnswers.forEach((ans) => {
      const q = questions.find((item) => item.id === ans.questionId);
      if (q && q.type === 'multiple_choice' && ans.isCorrect) {
        newScore += q.points || 10;
      }
    });
    setTotalScore(newScore);

    // Move to next question if not last
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Finish Game & compile session
  const handleFinishGame = () => {
    // Compute max score for multiple choice
    const maxScore = questions
      .filter((q) => q.type === 'multiple_choice')
      .reduce((sum, q) => sum + (q.points || 10), 0);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const session: GameSession = {
      id: `session_${Date.now()}`,
      playerName,
      department,
      completedAt: formattedDate,
      totalScore,
      maxScore,
      answers: currentAnswers,
      questionsSnapshot: questions,
    };

    const newSessions = [session, ...sessions];
    handleUpdateSessions(newSessions);
    setLatestSession(session);
    setCurrentScreen('result');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          if (screen === 'game' && currentAnswers.length === 0) {
            handleStartGame(playerName, department);
          } else {
            setCurrentScreen(screen);
          }
        }}
        playerName={playerName}
        score={totalScore}
        totalQuestions={questions.length}
        currentQuestionIndex={currentQuestionIndex}
      />

      <main className="flex-1">
        {currentScreen === 'home' && (
          <HomeScreen
            onStartGame={handleStartGame}
            onOpenAdmin={() => setCurrentScreen('admin')}
            totalQuestionsCount={questions.length}
          />
        )}

        {currentScreen === 'game' && questions.length > 0 && (
          <GameScreen
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            onAnswerSubmitted={handleAnswerSubmitted}
            onFinishGame={handleFinishGame}
            totalScore={totalScore}
            playerName={playerName}
          />
        )}

        {currentScreen === 'result' && latestSession && (
          <ResultScreen
            session={latestSession}
            onPlayAgain={() => handleStartGame(playerName, department)}
            onOpenAdmin={() => setCurrentScreen('admin')}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminScreen
            questions={questions}
            onUpdateQuestions={handleUpdateQuestions}
            sessions={sessions}
            onUpdateSessions={handleUpdateSessions}
            onBackToHome={() => setCurrentScreen('home')}
          />
        )}
      </main>
    </div>
  );
}
