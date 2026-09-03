import React, { useState } from 'react';
import { Play, Camera, Sparkles, ShieldCheck, HelpCircle, CheckCircle2, ChevronRight, User, Building2, Lightbulb } from 'lucide-react';
import { GestureCamera } from './GestureCamera';
import { SoundManager } from '../utils/audio';

interface HomeScreenProps {
  onStartGame: (name: string, dept: string) => void;
  onOpenAdmin: () => void;
  totalQuestionsCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartGame,
  onOpenAdmin,
  totalQuestionsCount,
}) => {
  const [playerName, setPlayerName] = useState('Nguyễn Văn An');
  const [department, setDepartment] = useState('Khối Quản Lý Vận Hành');
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [testedOption, setTestedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = playerName.trim() || 'Cán bộ Quản lý';
    const finalDept = department.trim() || 'Phòng ban Quản lý';
    SoundManager.playCorrect();
    onStartGame(finalName, finalDept);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-indigo-50/70 via-white to-amber-50/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="text-center space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-extrabold border border-indigo-200/80 shadow-xs animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>ĐẤU TRƯỜNG TRI THỨC LÃNH ĐẠO CẤP TRUNG</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Thử Thách Năng Lực <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-amber-500 bg-clip-text text-transparent">
              Quản Lý Cấp Trung
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Trò chơi tương tác hiện đại kết hợp <strong className="text-indigo-600 font-bold">nhận diện cử chỉ tay qua Camera</strong> và xử lý tình huống thực chiến dành cho các nhà quản trị tương lai.
          </p>
        </div>

        {/* 2-Column Main Section: Player Form & Gesture Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Player Info & Start Button (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-indigo-100/50 border border-slate-200/90 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Thông tin Học viên</h3>
                <p className="text-xs text-slate-500">Nhập thông tin để ghi nhận kết quả bài thi</p>
              </div>
            </div>

            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  Họ và tên Quản lý *
                </label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 font-semibold text-sm transition-all"
                  id="input-player-name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  Phòng ban / Bộ phận *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ví dụ: Khối Vận Hành & Kinh Doanh"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 font-semibold text-sm transition-all"
                  id="input-department"
                />
              </div>

              {/* Game Mode Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>Số lượng câu hỏi:</span>
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {totalQuestionsCount} câu thử thách
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hình thức:</span>
                  <span className="font-semibold text-slate-800">Trắc nghiệm cử chỉ + Trả lời ngắn</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tự luận / Tình huống:</span>
                  <span className="font-semibold text-amber-700">Giảng viên chấm sau</span>
                </div>
              </div>

              {/* Start Button */}
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-base shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                id="btn-start-game"
              >
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                <span>BẮT ĐẦU VÀO THI NGAY</span>
              </button>

              {/* Test Camera Button */}
              <button
                type="button"
                onClick={() => setShowCameraTest(!showCameraTest)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
                id="btn-test-camera-home"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>{showCameraTest ? 'Đóng thử nghiệm Camera' : 'Thử trước Camera & Cử chỉ ngón tay'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Gesture Rules & Guide (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Gesture Rule Cards */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-200/90 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    ✋
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg">
                    Quy Ước Điều Khiển Bằng Cử Chỉ Tay
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  AI Vision
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Với các câu trắc nghiệm, bạn có thể đưa bàn tay lên trước webcam để chọn đáp án. Hệ thống AI tự động phát hiện số lượng ngón tay và <strong className="text-slate-800">giữ yên 1 giây</strong> để tự động chốt đáp án:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1 Finger = A */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border-2 border-blue-200 text-center hover:shadow-md transition-all">
                  <div className="text-3xl mb-1">☝️</div>
                  <div className="text-xs font-extrabold text-blue-700">1 NGÓN TAY</div>
                  <div className="text-sm font-black text-blue-900 mt-1">ĐÁP ÁN A</div>
                  <div className="text-[10px] text-blue-600 font-medium mt-0.5">Ngón trỏ giơ lên</div>
                </div>

                {/* 2 Fingers = B */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-200 text-center hover:shadow-md transition-all">
                  <div className="text-3xl mb-1">✌️</div>
                  <div className="text-xs font-extrabold text-emerald-700">2 NGÓN TAY</div>
                  <div className="text-sm font-black text-emerald-900 mt-1">ĐÁP ÁN B</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Ngón trỏ + giữa</div>
                </div>

                {/* 3 Fingers = C */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border-2 border-amber-200 text-center hover:shadow-md transition-all">
                  <div className="text-3xl mb-1">🤟</div>
                  <div className="text-xs font-extrabold text-amber-700">3 NGÓN TAY</div>
                  <div className="text-sm font-black text-amber-900 mt-1">ĐÁP ÁN C</div>
                  <div className="text-[10px] text-amber-600 font-medium mt-0.5">3 ngón xòe lên</div>
                </div>

                {/* 4 Fingers = D */}
                <div className="p-3.5 rounded-2xl bg-pink-50/80 border-2 border-pink-200 text-center hover:shadow-md transition-all">
                  <div className="text-3xl mb-1">🖖</div>
                  <div className="text-xs font-extrabold text-pink-700">4 NGÓN TAY</div>
                  <div className="text-sm font-black text-pink-900 mt-1">ĐÁP ÁN D</div>
                  <div className="text-[10px] text-pink-600 font-medium mt-0.5">4 ngón (khép ngón cái)</div>
                </div>
              </div>

              {/* Extra notes */}
              <div className="bg-amber-50/60 rounded-2xl p-3.5 border border-amber-200/80 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Mẹo thực hiện chuẩn xác:</p>
                  <p>
                    Để bàn tay cách camera khoảng 40 - 70 cm nơi đủ ánh sáng. Nếu camera không khả dụng, bạn hoàn toàn có thể <strong>click chuột hoặc chạm màn hình</strong> để chọn đáp án!
                  </p>
                </div>
              </div>

              {/* Short Answer Explanatory Banner */}
              <div className="bg-indigo-50/60 rounded-2xl p-3.5 border border-indigo-200/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-1">
                  <p className="font-bold">Về các câu hỏi trả lời ngắn (Tự luận):</p>
                  <p>
                    Các câu này thử thách khả năng ra quyết định tình huống thực tế của nhà quản lý. Câu trả lời không tính đúng sai tự động mà sẽ được <strong>Giảng viên / Ban tổ chức đọc và chấm điểm thủ công</strong> trên trang Admin.
                  </p>
                </div>
              </div>
            </div>

            {/* In-place Camera Test Box if toggled */}
            {showCameraTest && (
              <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-sm">Khu vực thử nghiệm Cử chỉ AI</span>
                  </div>
                  {testedOption && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white">
                      Đã thử nghiệm thành công đáp án {testedOption}!
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-full sm:w-80">
                    <GestureCamera
                      mode="full"
                      onOptionLocked={(opt) => setTestedOption(opt)}
                    />
                  </div>
                  <div className="text-xs text-slate-300 space-y-2">
                    <p className="font-bold text-white text-sm">Hướng dẫn thử nghiệm:</p>
                    <p>1. Cấp quyền truy cập camera nếu trình duyệt hỏi.</p>
                    <p>2. Đưa bàn tay lên và thử dơ 1, 2, 3 hoặc 4 ngón tay.</p>
                    <p>3. Giữ yên 1 giây để thanh tiến trình hoàn thành và nghe âm thanh xác nhận.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Admin Footer Link */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-200 gap-3">
          <div className="flex items-center gap-2">
            <span>© Bộ tài liệu đào tạo Quản trị & Kỹ năng Lãnh đạo cấp trung</span>
          </div>

          <button
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-2 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-200 transition-colors"
            id="btn-admin-portal-link"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Màn hình Quản trị dành cho Giảng viên</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
