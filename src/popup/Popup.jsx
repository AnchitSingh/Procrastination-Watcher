import { useState, useEffect } from 'react';
import { getActiveAlert, setActiveAlert, clearActiveAlert, getWatcherSettings, setWatcherSettings } from '../utils/storage';
import { available } from '../utils/chromeAI';

function Popup() {
  const [goal, setGoal] = useState('');
  const [activeAlert, setActiveAlertState] = useState(null);
  const [interval, setInterval] = useState(3);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [alert, settings, status] = await Promise.all([
          getActiveAlert(),
          getWatcherSettings(),
          available()
        ]);
        
        setActiveAlertState(alert);
        setInterval(settings.checkInterval);
        setAiStatus(status);
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  const handleStartWatching = async () => {
    if (!goal.trim()) {
      return;
    }

    const alert = {
      goal: goal.trim(),
      enabled: true,
      startedAt: Date.now()
    };

    await setActiveAlert(alert);
    await setWatcherSettings({ checkInterval: interval, enabled: true });
    
    chrome.runtime.sendMessage({
      type: 'START_WATCHING',
      interval: interval
    });

    setActiveAlertState(alert);
  };

  const handleStopWatching = async () => {
    await clearActiveAlert();
    await setWatcherSettings({ checkInterval: interval, enabled: false });
    
    chrome.runtime.sendMessage({ type: 'STOP_WATCHING' });
    
    setActiveAlertState(null);
    setGoal('');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-[500px] w-[400px] bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 overflow-hidden relative">
      {/* Background Effects */}
      <BackgroundEffects />

      {/* Content */}
      <div className="relative z-10 p-5">
        {/* Header */}
        <header className="text-center mb-6 animate-fade-in">
          

          {/* Title */}
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            <span className="text-slate-800">Procrastination</span>
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"> Watcher</span>
          </h2>
          <p className="text-sm text-slate-600">Stay on track with AI monitoring</p>
        </header>

        {/* AI Status Warning */}
        {aiStatus?.status === 'no-api' && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2 animate-shake">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-red-800">AI Not Available</p>
              <p className="text-xs text-red-700">Use Chrome 127+ with AI enabled</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!activeAlert ? (
          <SetupView
            goal={goal}
            setGoal={setGoal}
            interval={interval}
            setInterval={setInterval}
            onStart={handleStartWatching}
            disabled={!goal.trim() || aiStatus?.status === 'no-api'}
          />
        ) : (
          <ActiveView
            alert={activeAlert}
            interval={interval}
            onStop={handleStopWatching}
          />
        )}

        {/* Footer */}
        <footer className="mt-6 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50">
            <svg className="w-3 h-3 mr-1.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
            </svg>
            <span className="text-xs font-medium text-green-800">100% On-Device Processing</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ===== Background Effects =====
const BackgroundEffects = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-amber-300/20 to-orange-300/20 rounded-full blur-3xl animate-pulse-slow" />
    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-300/20 to-amber-300/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
  </div>
);

// ===== Loading Screen =====
const LoadingScreen = () => (
  <div className="min-h-[500px] w-[400px] bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
        <svg className="w-6 h-6 text-amber-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <p className="text-sm text-slate-600">Loading...</p>
    </div>
  </div>
);

// ===== Setup View =====
const SetupView = ({ goal, setGoal, interval, setInterval, onStart, disabled }) => (
  <div className="space-y-4 animate-fade-in-up">
    {/* Goal Input */}
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        What are you working on?
      </label>
      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Example: Study React for 2 hours"
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all outline-none resize-none text-sm placeholder:text-slate-400"
      />
    </div>

    {/* Interval Selector */}
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Check every:
      </label>
      <select
        value={interval}
        onChange={(e) => setInterval(Number(e.target.value))}
        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all outline-none text-sm bg-white cursor-pointer"
      >
        <option value={1}>1 minute</option>
        <option value={2}>2 minutes</option>
        <option value={3}>3 minutes</option>
        <option value={5}>5 minutes</option>
        <option value={10}>10 minutes</option>
      </select>
    </div>

    {/* Features Preview */}
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/50 space-y-2">
      <FeatureItem icon="✓" text="Multimodal AI analysis" />
      <FeatureItem icon="✓" text="Smart distraction detection" />
      <FeatureItem icon="✓" text="Privacy-first monitoring" />
    </div>

    {/* Start Button */}
    <button
      onClick={onStart}
      disabled={disabled}
      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold shadow-lg shadow-amber-600/25 hover:shadow-amber-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Start Watching
    </button>
  </div>
);

const FeatureItem = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-xs text-slate-600">
    <span className="text-green-500 font-semibold">{icon}</span>
    <span>{text}</span>
  </div>
);

// ===== Active View =====
const ActiveView = ({ alert, interval, onStop }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const updateElapsed = () => {
      const minutes = Math.floor((Date.now() - alert.startedAt) / 60000);
      if (minutes < 60) {
        setElapsed(`${minutes}m`);
      } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        setElapsed(`${hours}h ${mins}m`);
      }
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 60000);
    return () => clearInterval(timer);
  }, [alert.startedAt]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Status Badge */}
      <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200/50">
        <div className="relative flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-green-800">Actively Watching</span>
        </div>
      </div>

      {/* Goal Display */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 mb-1">Current Goal</p>
            <p className="text-sm text-slate-800 leading-relaxed">{alert.goal}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
          label="Running for"
          value={elapsed}
        />
        <StatCard
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
          label="Check every"
          value={`${interval}min`}
        />
      </div>

      {/* Active Features */}
      <div className="bg-gradient-to-br from-slate-50 to-amber-50/30 rounded-xl p-3 border border-slate-200/50 space-y-2">
        <ActiveFeature icon="🔍" text="AI analyzing your activity" />
        <ActiveFeature icon="🛡️" text="All data stays on your device" />
        <ActiveFeature icon="⚡" text="Real-time monitoring active" />
      </div>

      {/* Stop Button */}
      <button
        onClick={onStop}
        className="w-full py-3 rounded-xl bg-white border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-700 hover:text-red-700 font-semibold transition-all duration-200 flex items-center justify-center gap-2 group"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
        Stop Watching
      </button>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-sm">
    <div className="flex items-center gap-2 mb-1">
      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
    <p className="text-lg font-bold text-slate-800">{value}</p>
  </div>
);

const ActiveFeature = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-xs text-slate-700">
    <span className="text-sm">{icon}</span>
    <span>{text}</span>
  </div>
);

export default Popup;