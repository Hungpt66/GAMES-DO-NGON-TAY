import React, { useState } from 'react';
import { Award, Volume2, VolumeX, ShieldCheck, Home, PlayCircle } from 'lucide-react';
import { SoundManager } from '../utils/audio';

interface NavbarProps {
  currentScreen: 'home' | 'game' | 'result' | 'admin';
  onNavigate: (screen: 'home' | 'game' | 'result' | 'admin') => void;
  playerName?: string;
  score?: number;
  totalQuestions?: number;
  currentQuestionIndex?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  playerName,
  score,
  totalQuestions,
  currentQuestionIndex,
}) => {
  const [isMuted, setIsMuted] = useState(!SoundManager.isEnabled());

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    SoundManager.setEnabled(!next);
    if (!next) {
      SoundManager.playGestureLock();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
          id="nav-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-slate-800 text-lg leading-tight tracking-tight flex items-center gap-2">
              <span>LEADERS QUIZ</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Quản Lý Cấp Trung
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Kiểm tra tri thức & Tương tác cử chỉ tay
            </p>
          </div>
        </div>

        {/* Center info if in game */}
        {currentScreen === 'game' && (
          <div className="hidden md:flex items-center gap-4 bg-slate-100/90 py-1.5 px-4 rounded-full border border-slate-200">
            {playerName && (
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
                👤 {playerName}
              </span>
            )}
            {typeof currentQuestionIndex === 'number' && typeof totalQuestions === 'number' && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Câu {currentQuestionIndex + 1}/{totalQuestions}
              </span>
            )}
            {typeof score === 'number' && (
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                {score} điểm
              </span>
            )}
          </div>
        )}

        {/* Right Navigation & Audio Control */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
            }`}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            id="nav-sound-toggle"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Quick Nav Buttons */}
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentScreen === 'home'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="nav-home-btn"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Trang chủ</span>
          </button>

          {currentScreen !== 'game' && (
            <button
              onClick={() => onNavigate('game')}
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
                currentScreen === 'game'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
              id="nav-play-btn"
            >
              <PlayCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Vào thi</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('admin')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentScreen === 'admin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
            id="nav-admin-btn"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Giảng viên / Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
