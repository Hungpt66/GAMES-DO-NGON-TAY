import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Download, ShieldCheck, CheckCircle2, XCircle, Clock, Star, MessageSquare, Award } from 'lucide-react';
import { GameSession } from '../types';
import { exportStudentSubmissionsToExcel } from '../utils/excelHelper';
import { SoundManager } from '../utils/audio';

interface ResultScreenProps {
  session: GameSession;
  onPlayAgain: () => void;
  onOpenAdmin: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  session,
  onPlayAgain,
  onOpenAdmin,
}) => {
  useEffect(() => {
    // Play triumphant sound
    SoundManager.playVictory();

    // Trigger celebratory confetti burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const multipleChoiceAnswers = session.answers.filter((a) => {
    const q = session.questionsSnapshot.find((item) => item.id === a.questionId);
    return q?.type === 'multiple_choice';
  });

  const shortAnswers = session.answers.filter((a) => {
    const q = session.questionsSnapshot.find((item) => item.id === a.questionId);
    return q?.type === 'short_answer';
  });

  const correctCount = multipleChoiceAnswers.filter((a) => a.isCorrect).length;
  const percentage = Math.round((session.totalScore / (session.maxScore || 1)) * 100);

  // Management Title Evaluation
  let titleRank = 'Quản Lý Tiềm Năng (Growing Manager)';
  let titleColor = 'from-blue-600 to-indigo-600';
  let badgeIcon = '🎯';

  if (percentage >= 85) {
    titleRank = 'Nhà Lãnh Đạo Xuất Sắc (Master Leader)';
    titleColor = 'from-amber-500 via-orange-500 to-rose-500';
    badgeIcon = '👑';
  } else if (percentage >= 70) {
    titleRank = 'Thuyền Trưởng Vững Vàng (Visionary Manager)';
    titleColor = 'from-emerald-500 to-teal-600';
    badgeIcon = '🌟';
  }

  const handleExport = () => {
    exportStudentSubmissionsToExcel([session], `Ket_qua_${session.playerName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-indigo-50/80 via-white to-amber-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Celebration Hero Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-indigo-100 border border-slate-200/90 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-indigo-100/60 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Trophy Icon */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wider uppercase mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Hoàn thành 10/10 Thử Thách</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
            Chúc Mừng {session.playerName}!
          </h1>
          <p className="text-sm font-semibold text-slate-500 mb-6">{session.department}</p>

          {/* Management Rank Badge */}
          <div className="inline-flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 text-white shadow-xl max-w-md mx-auto mb-6">
            <div className="text-xs text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <span>{badgeIcon}</span>
              <span>Danh hiệu Năng Lực Quản Trị</span>
            </div>
            <div className={`text-lg sm:text-xl font-black bg-gradient-to-r ${titleColor} bg-clip-text text-transparent mt-1`}>
              {titleRank}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80">
              <div className="text-xs font-bold text-indigo-700">Điểm Trắc Nghiệm</div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-900 mt-1">
                {session.totalScore}
                <span className="text-sm font-semibold text-indigo-500"> / {session.maxScore}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
              <div className="text-xs font-bold text-emerald-700">Đúng Trắc Nghiệm</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">
                {correctCount}
                <span className="text-sm font-semibold text-emerald-500"> / {multipleChoiceAnswers.length}</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
              <div className="text-xs font-bold text-amber-700">Câu Tự Luận</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">
                {shortAnswers.length}
                <span className="text-xs font-semibold text-amber-600 block sm:inline"> (Chờ chấm)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
            <button
              onClick={onPlayAgain}
              className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              id="btn-play-again"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử thách lại từ đầu</span>
            </button>

            <button
              onClick={handleExport}
              className="py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-sm border border-slate-300 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              id="btn-export-results"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Xuất kết quả ra Excel</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              id="btn-admin-grade-now"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Giảng viên chấm tự luận</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/90 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                Chi Tiết 10 Bài Học Quản Trị Trong Đề Thi
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Đối soát kết quả</span>
          </div>

          <div className="space-y-4">
            {session.answers.map((ans, idx) => {
              const q = session.questionsSnapshot.find((item) => item.id === ans.questionId);
              if (!q) return null;

              const isMC = q.type === 'multiple_choice';

              return (
                <div
                  key={ans.questionId}
                  className={`p-5 rounded-2xl border transition-all ${
                    isMC
                      ? ans.isCorrect
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-rose-50/40 border-rose-200'
                      : 'bg-indigo-50/40 border-indigo-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          [{q.category}]
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          • {ans.timeSpentSeconds}s
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {q.question}
                      </h4>
                    </div>

                    <div className="shrink-0">
                      {isMC ? (
                        ans.isCorrect ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 flex items-center gap-1 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" /> Sai
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 flex items-center gap-1 border border-purple-200">
                          <MessageSquare className="w-3.5 h-3.5" /> Tự luận
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Multiple Choice Answers Review */}
                  {isMC && q.options && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs sm:text-sm space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Bạn đã chọn:</span>
                        <span
                          className={`font-black px-2 py-0.5 rounded-md ${
                            ans.isCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                          }`}
                        >
                          Đáp án {ans.selectedOption}
                        </span>
                        {!ans.isCorrect && (
                          <span className="text-slate-500 font-medium">
                            (Đáp án đúng: <strong className="text-emerald-700">{q.correctAnswer}</strong>)
                          </span>
                        )}
                      </div>

                      {q.explanation && (
                        <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-slate-200/80 mt-2 leading-relaxed">
                          <strong className="text-slate-800">Bài học Quản trị:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Short Answer Essay Review */}
                  {!isMC && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs sm:text-sm space-y-2">
                      <div>
                        <span className="font-bold text-slate-700">Nội dung câu trả lời của bạn:</span>
                        <div className="bg-white p-3 rounded-xl border border-indigo-100 text-slate-800 font-medium text-xs leading-relaxed mt-1 whitespace-pre-wrap">
                          {ans.shortAnswerText || '(Chưa nhập)'}
                        </div>
                      </div>

                      {/* If teacher graded already */}
                      {ans.instructorScore !== undefined ? (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                          <div className="font-black">
                            Giảng viên chấm: {ans.instructorScore} / {q.points || 20} điểm
                          </div>
                          {ans.instructorFeedback && (
                            <div>
                              <strong>Nhận xét:</strong> {ans.instructorFeedback}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                          <span>⏳</span>
                          <span>Đang chờ Giảng viên đánh giá và nhận xét trên trang Quản trị.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
