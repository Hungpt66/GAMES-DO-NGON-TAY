import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, Plus, Trash2, Edit, Save, 
  RotateCcw, CheckCircle2, AlertCircle, Volume2, Image as ImageIcon, 
  HelpCircle, Eye, ChevronUp, ChevronDown, Check, X, Shield, Users
} from 'lucide-react';
import { Question, GameSession, SoundConfig } from '../types';
import { 
  exportQuestionsToExcel, 
  downloadSampleExcelTemplate, 
  parseQuestionsFromExcel,
  exportStudentSubmissionsToExcel 
} from '../utils/excelHelper';
import { SoundManager } from '../utils/audio';
import { INITIAL_QUESTIONS } from '../data/initialQuestions';

interface AdminScreenProps {
  questions: Question[];
  onUpdateQuestions: (newQuestions: Question[]) => void;
  sessions: GameSession[];
  onUpdateSessions: (sessions: GameSession[]) => void;
  onBackToHome: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  questions,
  onUpdateQuestions,
  sessions,
  onUpdateSessions,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'excel' | 'grading' | 'media'>('questions');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [excelImportStatus, setExcelImportStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [previewImportedQuestions, setPreviewImportedQuestions] = useState<Question[] | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessions[0]?.id || null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);

  // Form state for creating/editing question
  const [formData, setFormData] = useState<Partial<Question>>({
    type: 'multiple_choice',
    category: 'Quản trị & Lãnh đạo',
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    explanation: '',
    timeLimitSeconds: 30,
    points: 10,
    imageUrl: '',
  });

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingQuestion(null);
    setFormData({
      id: `q_${Date.now()}`,
      type: 'multiple_choice',
      category: 'Kỹ năng quản lý',
      question: '',
      options: {
        A: '',
        B: '',
        C: '',
        D: '',
      },
      correctAnswer: 'A',
      explanation: '',
      timeLimitSeconds: 30,
      points: 10,
      imageUrl: '',
    });
  };

  const openEditModal = (q: Question) => {
    setIsCreatingNew(false);
    setEditingQuestion(q);
    setFormData({
      ...q,
      options: q.options ? { ...q.options } : { A: '', B: '', C: '', D: '' },
    });
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question?.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    const questionToSave: Question = {
      id: formData.id || `q_${Date.now()}`,
      type: formData.type || 'multiple_choice',
      category: formData.category?.trim() || 'Kỹ năng quản lý',
      question: formData.question.trim(),
      explanation: formData.explanation?.trim() || '',
      timeLimitSeconds: Number(formData.timeLimitSeconds) || (formData.type === 'short_answer' ? 90 : 30),
      points: Number(formData.points) || 10,
      imageUrl: formData.imageUrl?.trim() || undefined,
    };

    if (formData.type === 'multiple_choice') {
      questionToSave.options = {
        A: formData.options?.A?.trim() || 'Đáp án A',
        B: formData.options?.B?.trim() || 'Đáp án B',
        C: formData.options?.C?.trim() || 'Đáp án C',
        D: formData.options?.D?.trim() || 'Đáp án D',
      };
      questionToSave.correctAnswer = formData.correctAnswer || 'A';
    }

    let updated: Question[];
    if (isCreatingNew) {
      updated = [...questions, questionToSave];
    } else {
      updated = questions.map((item) => (item.id === questionToSave.id ? questionToSave : item));
    }

    onUpdateQuestions(updated);
    setEditingQuestion(null);
    setIsCreatingNew(false);
    SoundManager.playCorrect();
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      const updated = questions.filter((q) => q.id !== id);
      onUpdateQuestions(updated);
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    onUpdateQuestions(updated);
  };

  const handleResetDefaultQuestions = () => {
    if (window.confirm('Bạn có muốn khôi phục lại 10 câu hỏi quản trị cấp trung tiêu chuẩn ban đầu?')) {
      onUpdateQuestions(INITIAL_QUESTIONS);
      SoundManager.playCorrect();
      alert('Đã khôi phục thành công 10 câu hỏi tiêu chuẩn!');
    }
  };

  // Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExcelImportStatus({ message: 'Đang đọc và kiểm tra dữ liệu file Excel...' });
      const imported = await parseQuestionsFromExcel(file);
      setPreviewImportedQuestions(imported);
      setExcelImportStatus({
        success: true,
        message: `Đã đọc thành công ${imported.length} câu hỏi từ file! Vui lòng kiểm tra và bấm "Áp dụng".`,
      });
      SoundManager.playCorrect();
    } catch (err: any) {
      setExcelImportStatus({
        success: false,
        message: `Lỗi đọc file Excel: ${err.message || 'Định dạng file không hợp lệ'}`,
      });
      SoundManager.playWrong();
    }
  };

  const handleApplyImportedQuestions = (replaceExisting: boolean) => {
    if (!previewImportedQuestions) return;

    if (replaceExisting) {
      onUpdateQuestions(previewImportedQuestions);
    } else {
      onUpdateQuestions([...questions, ...previewImportedQuestions]);
    }

    alert(`Đã nhập thành công ${previewImportedQuestions.length} câu hỏi vào ngân hàng!`);
    setPreviewImportedQuestions(null);
    setExcelImportStatus(null);
    setActiveTab('questions');
    SoundManager.playCorrect();
  };

  // Image Upload helper (converts to base64 Data URL)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setFormData((prev) => ({ ...prev, imageUrl: event.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Grading helper
  const handleUpdateGrade = (sessionId: string, questionId: string, score: number, feedback: string) => {
    const updated = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const updatedAnswers = s.answers.map((a) => {
        if (a.questionId !== questionId) return a;
        return {
          ...a,
          instructorScore: score,
          instructorFeedback: feedback,
        };
      });
      return {
        ...s,
        answers: updatedAnswers,
      };
    });
    onUpdateSessions(updated);
    SoundManager.playGestureLock();
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Cổng Quản Trị & Giảng Viên
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Quản lý ngân hàng câu hỏi, nhập xuất Excel, cấu hình media & chấm bài tự luận học viên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              Về Trang chủ
            </button>
            <button
              onClick={openCreateModal}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              id="btn-add-question-top"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Câu Hỏi Mới</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'questions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
            id="tab-questions"
          >
            <span>📋 Ngân hàng câu hỏi</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-indigo-500 text-white font-extrabold">
              {questions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'excel'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
            id="tab-excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất / Nhập Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('grading')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'grading'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
            id="tab-grading"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Chấm bài Học viên ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'media'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
            id="tab-media"
          >
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span>Âm thanh & Media</span>
          </button>
        </div>

        {/* TAB 1: QUESTION BANK LIST */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-600 font-medium">
                Hiện có <strong className="text-slate-900 font-bold">{questions.length}</strong> câu hỏi (
                {questions.filter((q) => q.type === 'multiple_choice').length} trắc nghiệm cử chỉ,{' '}
                {questions.filter((q) => q.type === 'short_answer').length} tự luận ngắn).
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDefaultQuestions}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Khôi phục lại 10 câu hỏi mặc định của hệ thống"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục 10 câu chuẩn</span>
                </button>
                <button
                  onClick={() => exportQuestionsToExcel(questions)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Excel</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const isMC = q.type === 'multiple_choice';

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Order controls */}
                        <div className="flex flex-col">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveQuestion(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                            title="Di chuyển lên"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === questions.length - 1}
                            onClick={() => handleMoveQuestion(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                            title="Di chuyển xuống"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200">
                          {idx + 1}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {q.category}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isMC
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {isMC ? 'Trắc nghiệm (1-4 ngón)' : 'Tự luận (Giảng viên chấm)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400 mr-2">
                          {q.timeLimitSeconds}s • {q.points} điểm
                        </span>
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                          title="Chỉnh sửa câu hỏi"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug pl-11">
                      {q.question}
                    </h3>

                    {/* Question image if attached */}
                    {q.imageUrl && (
                      <div className="pl-11">
                        <img
                          src={q.imageUrl}
                          alt="Minh họa"
                          className="h-28 rounded-xl object-cover border border-slate-200"
                        />
                      </div>
                    )}

                    {/* Multiple choice options preview */}
                    {isMC && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-11 pt-1 text-xs">
                        {(['A', 'B', 'C', 'D'] as const).map((key) => {
                          const isCorrect = key === q.correctAnswer;
                          return (
                            <div
                              key={key}
                              className={`p-2 rounded-xl border flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {key}
                              </span>
                              <span className="truncate">{q.options?.[key]}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[10px] text-emerald-700 font-extrabold">
                                  ✓ ĐÚNG
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="pl-11 text-xs text-slate-500 font-medium italic">
                        💡 <strong>Giải thích / Tiêu chí chấm:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: EXCEL IMPORT & EXPORT */}
        {activeTab === 'excel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Xuất Ngân Hàng Câu Hỏi Ra Excel
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Tải toàn bộ danh sách {questions.length} câu hỏi hiện tại thành file Excel (.xlsx) chuẩn để lưu trữ hoặc chia sẻ cho các giảng viên khác.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => exportQuestionsToExcel(questions)}
                    className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    id="btn-export-excel-file"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Tải File Ngân Hàng Câu Hỏi (.xlsx)</span>
                  </button>

                  <button
                    onClick={downloadSampleExcelTemplate}
                    className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    id="btn-download-sample-excel"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>Tải File Excel Mẫu</span>
                  </button>
                </div>
              </div>

              {/* Import Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Nhập Câu Hỏi Từ File Excel (.xlsx / .csv)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Chọn file Excel chứa các cột chuẩn: Loại câu hỏi, Chủ đề, Nội dung, Đáp án A/B/C/D, Đáp án đúng... Hệ thống sẽ tự động phân tích và nhập vào bài thi.
                  </p>
                </div>

                <div className="pt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    id="input-excel-file"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-6 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl text-center text-xs font-bold text-indigo-700 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-indigo-600" />
                    <span>Bấm vào đây để chọn file Excel từ máy tính</span>
                    <span className="text-[10px] text-slate-400 font-normal">Hỗ trợ định dạng .xlsx, .xls, .csv</span>
                  </button>
                </div>

                {/* Import Status Alert */}
                {excelImportStatus && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                      excelImportStatus.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}
                  >
                    {excelImportStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>{excelImportStatus.message}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Imported Preview if available */}
            {previewImportedQuestions && (
              <div className="bg-white rounded-3xl p-6 border border-emerald-300 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Xem trước {previewImportedQuestions.length} câu hỏi chuẩn bị nhập
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplyImportedQuestions(false)}
                      className="py-2 px-4 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all"
                    >
                      Thêm nối tiếp vào ngân hàng
                    </button>
                    <button
                      onClick={() => handleApplyImportedQuestions(true)}
                      className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm transition-all"
                    >
                      Ghi đè thay thế toàn bộ
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
                  {previewImportedQuestions.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-indigo-700">Câu {idx + 1}:</span>
                        <span className="font-bold text-slate-800">{item.question}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Loại: {item.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'} | Đáp án đúng: {item.correctAnswer || 'N/A'} | Chủ đề: {item.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GRADING STUDENT ESSAYS */}
        {activeTab === 'grading' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Danh Sách & Chấm Điểm Bài Thi Học Viên ({sessions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Xem chi tiết bài làm, đánh giá câu trả lời tình huống tự luận và chấm điểm thủ công
                </p>
              </div>

              {sessions.length > 0 && (
                <button
                  onClick={() => exportStudentSubmissionsToExcel(sessions)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Toàn Bộ Bảng Điểm Ra Excel</span>
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-extrabold text-slate-700 text-base">Chưa có bài thi nào được hoàn thành</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Khi học viên hoàn thành bài thi ở màn hình Game, kết quả sẽ tự động lưu và hiển thị tại đây để Giảng viên chấm điểm.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Session List (4 cols) */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2 max-h-[600px] overflow-y-auto">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Học viên đã nộp bài
                  </div>
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedSession?.id === s.id
                          ? 'bg-indigo-50/80 border-indigo-300 shadow-sm'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">{s.playerName}</span>
                        <span className="text-xs font-black text-indigo-600">{s.totalScore}đ</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.department}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{s.completedAt}</div>
                    </div>
                  ))}
                </div>

                {/* Right: Selected Student Essay Grading (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                  {selectedSession ? (
                    <>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <h4 className="font-black text-slate-900 text-lg">
                            Bài làm: {selectedSession.playerName}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Phòng ban: {selectedSession.department} • Điểm trắc nghiệm: {selectedSession.totalScore}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          {selectedSession.completedAt}
                        </span>
                      </div>

                      {/* List Answers */}
                      <div className="space-y-4">
                        {selectedSession.answers.map((ans, idx) => {
                          const q = selectedSession.questionsSnapshot.find((item) => item.id === ans.questionId);
                          if (!q) return null;
                          const isMC = q.type === 'multiple_choice';

                          return (
                            <div
                              key={ans.questionId}
                              className={`p-4 rounded-2xl border ${
                                isMC ? 'bg-slate-50/60 border-slate-200' : 'bg-indigo-50/40 border-indigo-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <span className="text-xs font-black text-indigo-700">Câu {idx + 1}: </span>
                                  <span className="text-xs font-bold text-slate-800">{q.question}</span>
                                </div>
                                <span className="text-xs font-extrabold text-slate-500 shrink-0">
                                  {isMC ? (ans.isCorrect ? '✓ Đúng (+10đ)' : '✗ Sai (0đ)') : '📝 Tự luận'}
                                </span>
                              </div>

                              {/* If short answer: show text and grading controls */}
                              {!isMC && (
                                <div className="space-y-3 pt-2 border-t border-indigo-100">
                                  <div>
                                    <span className="text-xs font-bold text-slate-700">Nội dung học viên trả lời:</span>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-900 mt-1 whitespace-pre-wrap font-medium">
                                      {ans.shortAnswerText || '(Chưa có câu trả lời)'}
                                    </div>
                                  </div>

                                  {/* Instructor grading form */}
                                  <div className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <label className="text-xs font-bold text-slate-700">
                                        Điểm Giảng viên chấm (Tối đa {q.points || 20}đ):
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={q.points || 20}
                                        defaultValue={ans.instructorScore ?? 15}
                                        onBlur={(e) =>
                                          handleUpdateGrade(
                                            selectedSession.id,
                                            ans.questionId,
                                            Number(e.target.value),
                                            ans.instructorFeedback || ''
                                          )
                                        }
                                        className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-center"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nhận xét & Định hướng của Giảng viên:
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Ví dụ: Phân tích thấu cảm tốt, cần bổ sung thêm mốc đo lường KPI..."
                                        defaultValue={ans.instructorFeedback || ''}
                                        onBlur={(e) =>
                                          handleUpdateGrade(
                                            selectedSession.id,
                                            ans.questionId,
                                            ans.instructorScore ?? 15,
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SOUND & MEDIA SETTINGS */}
        {activeTab === 'media' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Cấu Hình Âm Thanh & Hình Ảnh</h3>
              <p className="text-xs text-slate-500">
                Kiểm tra các hiệu ứng âm thanh tương tác hoặc thêm file âm thanh / hình ảnh tùy chỉnh
              </p>
            </div>

            {/* Test Audio Buttons */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span>Kiểm tra âm thanh trò chơi (Web Audio Synthesizer)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => SoundManager.playCorrect()}
                  className="py-3 px-4 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold border border-emerald-300 flex items-center justify-center gap-2"
                >
                  <span>🔔</span>
                  <span>Âm Đúng (Chime)</span>
                </button>

                <button
                  onClick={() => SoundManager.playWrong()}
                  className="py-3 px-4 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold border border-rose-300 flex items-center justify-center gap-2"
                >
                  <span>⚠️</span>
                  <span>Âm Sai (Gentle)</span>
                </button>

                <button
                  onClick={() => SoundManager.playGestureLock()}
                  className="py-3 px-4 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-bold border border-indigo-300 flex items-center justify-center gap-2"
                >
                  <span>✋</span>
                  <span>Khóa Cử Chỉ (Ping)</span>
                </button>

                <button
                  onClick={() => SoundManager.playVictory()}
                  className="py-3 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 flex items-center justify-center gap-2"
                >
                  <span>🎺</span>
                  <span>Fanfare Chiến Thắng</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CREATE / EDIT QUESTION */}
        {(isCreatingNew || editingQuestion) && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-lg">
                  {isCreatingNew ? 'Thêm Câu Hỏi Mới' : 'Chỉnh Sửa Câu Hỏi'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingQuestion(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                {/* Type & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Loại câu hỏi *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                    >
                      <option value="multiple_choice">Trắc nghiệm (Cử chỉ tay 1-4 ngón)</option>
                      <option value="short_answer">Trả lời ngắn / Tình huống (Giảng viên chấm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Chủ đề / Kỹ năng *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="VD: Ủy quyền, Giải quyết xung đột..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nội dung câu hỏi *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Nhập nội dung câu hỏi tình huống cho quản lý cấp trung..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Multiple choice options if type is MC */}
                {formData.type === 'multiple_choice' && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      4 Lựa chọn đáp án (A: 1 ngón, B: 2 ngón, C: 3 ngón, D: 4 ngón)
                    </div>

                    {(['A', 'B', 'C', 'D'] as const).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {key}
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.options?.[key] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              options: { ...formData.options!, [key]: e.target.value },
                            })
                          }
                          placeholder={`Nội dung đáp án ${key}`}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800"
                        />
                      </div>
                    ))}

                    <div className="pt-2 flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-700">Đáp án ĐÚNG:</label>
                      <select
                        value={formData.correctAnswer}
                        onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value as any })}
                        className="px-3 py-1.5 rounded-lg border border-emerald-400 bg-emerald-50 text-xs font-black text-emerald-900"
                      >
                        <option value="A">Đáp án A (☝️ 1 ngón)</option>
                        <option value="B">Đáp án B (✌️ 2 ngón)</option>
                        <option value="C">Đáp án C (🤟 3 ngón)</option>
                        <option value="D">Đáp án D (🖖 4 ngón)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Explanation / Grading Criteria */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Giải thích bài học quản trị / Tiêu chí chấm:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Giải thích vì sao đáp án đúng hoặc tiêu chí chấm bài cho giảng viên..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Time & Points & Image */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian (giây)</label>
                    <input
                      type="number"
                      value={formData.timeLimitSeconds}
                      onChange={(e) => setFormData({ ...formData, timeLimitSeconds: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tải ảnh minh họa</label>
                    <input
                      type="file"
                      ref={imageUploadRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageUploadRef.current?.click()}
                      className="w-full py-1.5 px-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{formData.imageUrl ? 'Đổi ảnh' : 'Chọn ảnh'}</span>
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setEditingQuestion(null);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Câu Hỏi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
