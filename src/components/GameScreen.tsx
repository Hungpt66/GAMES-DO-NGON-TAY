import React, { useState, useEffect, useRef } from 'react';
import { Clock, Award, CheckCircle, XCircle, AlertCircle, ArrowRight, Hand, MessageSquare, Send, Sparkles } from 'lucide-react';
import { Question, UserAnswer } from '../types';
import { GestureCamera } from './GestureCamera';
import { SoundManager } from '../utils/audio';

interface GameScreenProps {
  questions: Question[];
  currentQuestionIndex: number;
  onAnswerSubmitted: (answer: UserAnswer) => void;
  onFinishGame: () => void;
  totalScore: number;
  playerName: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  questions,
  currentQuestionIndex,
  onAnswerSubmitted,
  onFinishGame,
  totalScore,
  playerName,
}) => {
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Question state
  const timeLimit = currentQuestion?.timeLimitSeconds || (currentQuestion?.type === 'short_answer' ? 90 : 30);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [shortAnswerText, setShortAnswerText] = useState<string>('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [highlightOption, setHighlightOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Reset state when moving to a new question
  useEffect(() => {
    setTimeLeft(timeLimit);
    setHasAnswered(false);
    setSelectedOption(null);
    setShortAnswerText('');
    setIsAnswerCorrect(null);
    setHighlightOption(null);
    startTimeRef.current = Date.now();

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        // Play tick sound on last 5 seconds
        if (prev <= 6) {
          SoundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]);

  // Handle time out
  const handleTimeOut = () => {
    if (hasAnswered) return;
    setHasAnswered(true);

    if (currentQuestion.type === 'multiple_choice') {
      setIsAnswerCorrect(false);
      SoundManager.playWrong();
    } else {
      // Short answer times out: submit whatever was typed
      submitShortAnswer(true);
    }
  };

  // Handle Multiple Choice selection (via gesture or click)
  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (hasAnswered || currentQuestion.type !== 'multiple_choice') return;

    if (timerRef.current) clearInterval(timerRef.current);
    setHasAnswered(true);
    setSelectedOption(opt);
    setHighlightOption(opt);

    const isCorrect = opt === currentQuestion.correctAnswer;
    setIsAnswerCorrect(isCorrect);

    if (isCorrect) {
      SoundManager.playCorrect();
    } else {
      SoundManager.playWrong();
    }

    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOption: opt,
      isCorrect,
      timeSpentSeconds: timeSpent,
    };
    onAnswerSubmitted(answer);
  };

  // Handle Short Answer Submission
  const submitShortAnswer = (isAutoTimeOut = false) => {
    if (hasAnswered && !isAutoTimeOut) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setHasAnswered(true);

    const textToSubmit = shortAnswerText.trim() || (isAutoTimeOut ? '(Hết thời gian - Chưa nhập kịp câu trả lời)' : '(Không trả lời)');
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    // Play pleasant confirmation sound
    SoundManager.playCorrect();

    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      shortAnswerText: textToSubmit,
      isCorrect: undefined, // pending teacher review
      timeSpentSeconds: timeSpent,
    };
    onAnswerSubmitted(answer);
  };

  // Progress to next question or finish
  const handleNext = () => {
    if (isLastQuestion) {
      onFinishGame();
    } else {
      // Parent handles moving question index
      onAnswerSubmitted({
        questionId: currentQuestion.id,
        selectedOption: selectedOption || undefined,
        shortAnswerText: shortAnswerText || undefined,
        isCorrect: isAnswerCorrect ?? undefined,
        timeSpentSeconds: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
      });
    }
  };

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const timerPercent = (timeLeft / timeLimit) * 100;

  // Options style helpers
  const getOptionStyle = (key: 'A' | 'B' | 'C' | 'D') => {
    if (!hasAnswered) {
      return 'bg-white hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-400 text-slate-800 shadow-sm hover:shadow-md cursor-pointer';
    }

    // Answered
    if (key === currentQuestion.correctAnswer) {
      return 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-200';
    }

    if (key === selectedOption && !isAnswerCorrect) {
      return 'bg-rose-50 border-2 border-rose-400 text-rose-950 shadow-md';
    }

    return 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
  };

  const getGestureIcon = (key: 'A' | 'B' | 'C' | 'D') => {
    switch (key) {
      case 'A':
        return { emoji: '☝️', label: '1 ngón tay' };
      case 'B':
        return { emoji: '✌️', label: '2 ngón tay' };
      case 'C':
        return { emoji: '🤟', label: '3 ngón tay' };
      case 'D':
        return { emoji: '🖖', label: '4 ngón tay' };
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Bar: Progress & Live Stats */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Progress Bar & Question index */}
          <div className="w-full sm:w-1/2 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Câu {currentQuestionIndex + 1} / {totalQuestions}
              </span>
              <span className="text-slate-500">{Math.round(progressPercent)}% hoàn thành</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-600 to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Right Stats: Countdown Timer & Score */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Timer Ring/Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-extrabold text-sm transition-all ${
                timeLeft <= 5
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                  : timeLeft <= 10
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s</span>
            </div>

            {/* Live Score */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-sm shadow-xs">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>{totalScore} Điểm</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center: Question & Answers (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Question Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/90 space-y-5 relative">
              {/* Category Tag & Question Type */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200">
                  {currentQuestion?.category || 'Kỹ Năng Quản Trị'}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      currentQuestion?.type === 'multiple_choice'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {currentQuestion?.type === 'multiple_choice'
                      ? 'Trắc nghiệm (Cử chỉ tay 1-4 ngón)'
                      : 'Tự luận tình huống (Giảng viên chấm)'}
                  </span>
                  <span className="text-xs font-extrabold text-slate-500">
                    +{currentQuestion?.points || 10} điểm
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {currentQuestion?.question}
              </h2>

              {/* Optional Question Image */}
              {currentQuestion?.imageUrl && (
                <div className="rounded-2xl overflow-hidden max-h-60 border border-slate-200">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Hình ảnh câu hỏi"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* MULTIPLE CHOICE OPTIONS */}
              {currentQuestion?.type === 'multiple_choice' && currentQuestion.options && (
                <div className="grid grid-cols-1 gap-3.5 pt-2">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const optText = currentQuestion.options?.[key];
                    const gesture = getGestureIcon(key);
                    const isPicked = selectedOption === key;
                    const isRight = key === currentQuestion.correctAnswer;

                    return (
                      <button
                        key={key}
                        disabled={hasAnswered}
                        onClick={() => handleSelectOption(key)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3.5 relative overflow-hidden group ${getOptionStyle(
                          key
                        )}`}
                        id={`option-btn-${key}`}
                      >
                        {/* Letter & Gesture Badge */}
                        <div className="shrink-0 flex flex-col items-center">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-xs transition-transform group-hover:scale-105 ${
                              isPicked
                                ? isRight
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-rose-600 text-white border-rose-500'
                                : 'bg-slate-100 text-slate-800 border-slate-200 group-hover:bg-indigo-600 group-hover:text-white'
                            }`}
                          >
                            {key}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-0.5">
                            <span>{gesture.emoji}</span>
                            <span className="hidden sm:inline text-[10px]">{gesture.label}</span>
                          </span>
                        </div>

                        {/* Option Text */}
                        <div className="flex-1 text-sm sm:text-base font-semibold leading-relaxed pt-1">
                          {optText}
                        </div>

                        {/* Status Icon when answered */}
                        {hasAnswered && (
                          <div className="shrink-0 pt-1">
                            {isRight ? (
                              <CheckCircle className="w-6 h-6 text-emerald-600" />
                            ) : isPicked ? (
                              <XCircle className="w-6 h-6 text-rose-600" />
                            ) : null}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* SHORT ANSWER INPUT */}
              {currentQuestion?.type === 'short_answer' && (
                <div className="space-y-4 pt-2">
                  <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
                    <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Lưu ý dành cho Học viên:</strong> Câu hỏi này không tính đúng sai tự động. Câu trả lời của bạn sẽ được chuyển thẳng tới Giảng viên để chấm điểm và nhận xét năng lực quản lý sau trò chơi.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Nhập kế hoạch hành động / giải pháp của bạn:
                    </label>
                    <textarea
                      rows={5}
                      disabled={hasAnswered}
                      value={shortAnswerText}
                      onChange={(e) => setShortAnswerText(e.target.value)}
                      placeholder="Trình bày ngắn gọn, mạch lạc giải pháp quản lý thực tế theo từng bước..."
                      className="w-full p-4 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm font-medium transition-all disabled:bg-slate-100 disabled:text-slate-500 resize-y"
                      id="textarea-short-answer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                      <span>{shortAnswerText.trim().split(/\s+/).filter(Boolean).length} từ</span>
                      <span>{shortAnswerText.length} ký tự</span>
                    </div>
                  </div>

                  {!hasAnswered && (
                    <button
                      onClick={() => submitShortAnswer(false)}
                      disabled={!shortAnswerText.trim()}
                      className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      id="btn-submit-short-answer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Xác nhận & Nộp câu trả lời</span>
                    </button>
                  )}
                </div>
              )}

              {/* POST-ANSWER FEEDBACK & MANAGEMENT TAKEAWAY */}
              {hasAnswered && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {/* Feedback Banner */}
                  {currentQuestion.type === 'multiple_choice' ? (
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        isAnswerCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}
                    >
                      {isAnswerCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-black text-sm">
                          {isAnswerCorrect
                            ? 'CHÍNH XÁC! BẠN ĐÃ ĐƯỢC CỘNG ĐIỂM!'
                            : `CHƯA CHÍNH XÁC! ĐÁP ÁN ĐÚNG LÀ: ${currentQuestion.correctAnswer}`}
                        </div>
                        {currentQuestion.explanation && (
                          <div className="text-xs sm:text-sm mt-1 text-slate-700 leading-relaxed font-medium">
                            <strong>Góc nhìn Quản trị:</strong> {currentQuestion.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-black text-sm">ĐÃ GHI NHẬN CÂU TRẢ LỜI CỦA BẠN!</div>
                        <div className="text-xs sm:text-sm mt-1 text-slate-700 font-medium">
                          {currentQuestion.explanation ||
                            'Hệ thống đã lưu lại nội dung. Giảng viên sẽ đọc và đánh giá năng lực giải quyết vấn đề của bạn.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNext}
                      className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                      id="btn-next-question"
                    >
                      <span>{isLastQuestion ? 'Xem Kết Quả Tổng Kết' : 'Sang Câu Tiếp Theo'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Camera AI & Gesture Assistant (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Gesture Camera Widget */}
            <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50 border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <Hand className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Điều khiển bằng Cử chỉ</h4>
                    <p className="text-[11px] text-slate-500">Giữ yên 1 giây để chọn</p>
                  </div>
                </div>
              </div>

              {/* Webcam Box */}
              <GestureCamera
                disabled={hasAnswered || currentQuestion.type !== 'multiple_choice'}
                highlightOption={highlightOption}
                onOptionLocked={(opt) => handleSelectOption(opt)}
                mode="compact"
              />

              {/* Interactive Gesture Guide Cards for Reference */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2">
                  <span className="text-xl">☝️</span>
                  <div>
                    <div className="font-extrabold text-blue-800">1 ngón</div>
                    <div className="text-[10px] text-blue-600">Đáp án A</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                  <span className="text-xl">✌️</span>
                  <div>
                    <div className="font-extrabold text-emerald-800">2 ngón</div>
                    <div className="text-[10px] text-emerald-600">Đáp án B</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                  <span className="text-xl">🤟</span>
                  <div>
                    <div className="font-extrabold text-amber-800">3 ngón</div>
                    <div className="text-[10px] text-amber-600">Đáp án C</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-pink-50 border border-pink-200 flex items-center gap-2">
                  <span className="text-xl">🖖</span>
                  <div>
                    <div className="font-extrabold text-pink-800">4 ngón</div>
                    <div className="text-[10px] text-pink-600">Đáp án D</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Summary Box */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-3">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Hồ sơ Người chơi
              </div>
              <div>
                <div className="font-extrabold text-base text-white">{playerName}</div>
                <div className="text-xs text-slate-300 font-medium">Cán bộ Quản lý Cấp trung</div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                <span className="text-slate-400">Điểm hiện tại:</span>
                <span className="text-emerald-400 font-bold">{totalScore} điểm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
