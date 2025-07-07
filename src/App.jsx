import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Target, Heart, Calendar, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const PurposeAnchorApp = () => {
  // LocalStorage key for sessions
  const SESSIONS_STORAGE_KEY = 'purpose-anchor-sessions';

  // LocalStorage utilities
  const loadSessionsFromStorage = () => {
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return storedSessions ? JSON.parse(storedSessions) : [];
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      return [];
    }
  };

  const saveSessionsToStorage = (sessions) => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  };

  const [phase, setPhase] = useState('setup'); // setup, focus, reflection, history
  const [timeMinutes, setTimeMinutes] = useState(60);
  const [customTime, setCustomTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [outcome, setOutcome] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [sessionFocus, setSessionFocus] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [fulfilled, setFulfilled] = useState('');
  const [reflection, setReflection] = useState('');
  const [sessions, setSessions] = useState(loadSessionsFromStorage);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const timePresets = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 }
  ];

  const sessionTypes = [
    'Deep Work', 'Creative Flow', 'Analysis', 'Planning', 'Learning', 'Communication', 'Review', 'Other'
  ];

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    saveSessionsToStorage(sessions);
  }, [sessions]);

  // Audio chime functionality
  const playChime = () => {
    try {
      // Create a simple chime sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant chime sound (bell-like)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play chime:', error);
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            setIsActive(false);
            setPhase('reflection');
            playChime(); // Play chime when timer reaches 0
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    } else if (!isActive && timeLeft !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const startSession = () => {
    const finalTime = timeMinutes === 'custom' ? parseInt(customTime) : timeMinutes;
    setTimeLeft(finalTime * 60);
    setPhase('focus');
    setIsActive(true);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const endSession = () => {
    setIsActive(false);
    setPhase('reflection');
  };

  const saveSession = () => {
    const finalTime = timeMinutes === 'custom' ? parseInt(customTime) : timeMinutes;
    const completedTime = finalTime - Math.floor(timeLeft / 60);
    
    const newSession = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      startTime: new Date(Date.now() - (completedTime * 60 * 1000)).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      duration: completedTime,
      plannedDuration: finalTime,
      purpose,
      outcome,
      sessionType,
      sessionFocus,
      fulfilled,
      reflection,
      timestamp: new Date().toISOString()
    };

    setSessions(prev => [newSession, ...prev]);
    startNewSession();
  };

  const startNewSession = () => {
    setPhase('setup');
    setPurpose('');
    setOutcome('');
    setSessionType('');
    setSessionFocus('');
    setFulfilled('');
    setReflection('');
    setTimeLeft(0);
    setIsActive(false);
  };

  const getSessionsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions.filter(session => session.date === dateStr);
  };

  const getSessionCountForDate = (date) => {
    return getSessionsForDate(date).length;
  };

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-blue-200';
    if (count === 2) return 'bg-blue-400';
    if (count === 3) return 'bg-blue-600';
    return 'bg-blue-800';
  };

  const generateCalendarDays = () => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDay = start.getDay();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= end.getDate(); day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }

    return days;
  };

  const getCurrentStreak = () => {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayHasSessions = sessions.some(session => session.date === dateStr);
      
      if (dayHasSessions) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Anchor Your Purpose</h1>
            <p className="text-gray-600 text-sm">Transform this session into an act of worship, craft, and contribution</p>
            {sessions.length > 0 && (
              <div className="mt-4 flex justify-center items-center space-x-4 text-sm">
                <span className="text-blue-600 font-medium">🔥 {getCurrentStreak()} day streak</span>
                <button
                  onClick={() => setPhase('history')}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>History</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {timePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setTimeMinutes(preset.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      timeMinutes === preset.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTimeMinutes('custom')}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    timeMinutes === 'custom'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Custom
                </button>
                {timeMinutes === 'custom' && (
                  <input
                    type="number"
                    placeholder="Minutes"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type of Work</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select session type...</option>
                {sessionTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What will this session be about?</label>
              <input
                type="text"
                value={sessionFocus}
                onChange={(e) => setSessionFocus(e.target.value)}
                placeholder="Describe what you'll be working on..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-1" />
                Why does this work matter beyond me?
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Connect this to your team, customers, family, faith, or long-term goals..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                If you accomplish just one thing this session, what should it be?
              </label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Be specific and concrete..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={startSession}
            disabled={!purpose || !outcome || !sessionType || !sessionFocus || (timeMinutes === 'custom' && !customTime)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Begin Sacred Session</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'focus') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="text-white space-y-4">
            <Clock className="w-12 h-12 mx-auto text-blue-300" />
            <h1 className="text-6xl font-light tracking-wide">{formatTime(timeLeft)}</h1>
            <p className="text-blue-200 text-lg">Sacred focus time</p>
            <p className="text-blue-300 text-sm">{sessionType}</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-blue-200 text-sm font-medium mb-2">Working On</h3>
              <p className="text-white font-medium text-lg">{sessionFocus}</p>
            </div>
            <div>
              <h3 className="text-blue-200 text-sm font-medium mb-2">Your Purpose</h3>
              <p className="text-white text-sm leading-relaxed">{purpose}</p>
            </div>
            <div>
              <h3 className="text-blue-200 text-sm font-medium mb-2">Your Goal</h3>
              <p className="text-white font-medium">{outcome}</p>
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            <button
              onClick={toggleTimer}
              className="bg-white/20 backdrop-blur text-white p-4 rounded-full hover:bg-white/30 transition-colors"
            >
              {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button
              onClick={endSession}
              className="bg-white/20 backdrop-blur text-white px-6 py-4 rounded-full hover:bg-white/30 transition-colors text-sm font-medium"
            >
              End Session
            </button>
          </div>

          <div className="text-blue-200 text-xs italic">
            "This hour is an act of worship, craft, and contribution."
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'reflection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Reflect & Close</h1>
            <p className="text-gray-600 text-sm">Honor the work you've done</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Did you fulfill your intent?</label>
              <div className="space-y-2">
                {['Yes, completely', 'Mostly', 'Partially', 'Not really'].map((option) => (
                  <label key={option} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="fulfilled"
                      value={option}
                      checked={fulfilled === option}
                      onChange={(e) => setFulfilled(e.target.value)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How did this session move you toward your long-term direction?
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What did you learn? How will you adjust course for next time?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows="3"
              />
            </div>
          </div>

          <button
            onClick={saveSession}
            disabled={!fulfilled}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Complete & Start New Session</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'history') {
    const calendarDays = generateCalendarDays();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    if (selectedDate) {
      const selectedSessions = getSessionsForDate(selectedDate);
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Calendar</span>
                </button>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <div className="text-sm text-gray-600">
                  {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}
                </div>
              </div>

              {selectedSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No sessions on this day</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSessions.map((session) => (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600">{session.startTime}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {session.sessionType}
                          </span>
                          <span className="text-sm text-gray-500">{formatDuration(session.duration)}</span>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          session.fulfilled === 'Yes, completely' ? 'bg-green-100 text-green-700' :
                          session.fulfilled === 'Mostly' ? 'bg-yellow-100 text-yellow-700' :
                          session.fulfilled === 'Partially' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {session.fulfilled}
                        </div>
                      </div>
                      <h3 className="font-medium text-gray-800 mb-1">{session.outcome}</h3>
                      <p className="text-sm text-gray-700 mb-1">{session.sessionFocus}</p>
                      <p className="text-sm text-gray-600 mb-2">{session.purpose}</p>
                      {session.reflection && (
                        <p className="text-sm text-gray-500 italic">{session.reflection}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setPhase('setup')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Sessions</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Session History</h1>
              <div className="text-sm text-gray-600">
                {sessions.length} total sessions
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No sessions yet. Start your first purposeful session!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Calendar Heatmap */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Activity Calendar</h2>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => (
                      <div key={index} className="aspect-square">
                        {day ? (
                          <button
                            onClick={() => setSelectedDate(day)}
                            className={`w-full h-full rounded text-xs font-medium hover:ring-2 hover:ring-blue-300 transition-all ${
                              getHeatmapColor(getSessionCountForDate(day))
                            } ${getSessionCountForDate(day) > 0 ? 'text-white' : 'text-gray-700'}`}
                          >
                            {day.getDate()}
                          </button>
                        ) : (
                          <div className="w-full h-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-gray-500">Click any day to see sessions</div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Less</span>
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-gray-100 rounded"></div>
                        <div className="w-3 h-3 bg-blue-200 rounded"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded"></div>
                        <div className="w-3 h-3 bg-blue-600 rounded"></div>
                        <div className="w-3 h-3 bg-blue-800 rounded"></div>
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Sessions</h2>
                  <div className="space-y-3">
                    {sessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-500">
                            {new Date(session.timestamp).toLocaleDateString()}
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {session.sessionType}
                          </span>
                          <div className="text-sm font-medium text-gray-800">
                            {session.outcome}
                          </div>
                          <div className="text-sm text-gray-600">
                            {session.sessionFocus}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">{formatDuration(session.duration)}</span>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            session.fulfilled === 'Yes, completely' ? 'bg-green-100 text-green-700' :
                            session.fulfilled === 'Mostly' ? 'bg-yellow-100 text-yellow-700' :
                            session.fulfilled === 'Partially' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {session.fulfilled}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default PurposeAnchorApp;