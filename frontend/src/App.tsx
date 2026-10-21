import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RoomsExplorer } from './components/RoomsExplorer';
import { StudyRoomView } from './components/StudyRoomView';
import { PomodoroTimerModal } from './components/PomodoroTimerModal';
import { DirectMessagesModal } from './components/DirectMessagesModal';
import { AuthModal } from './components/AuthModal';
import { StudyRoom } from './api/client';
import confetti from 'canvas-confetti';

const MainLayout: React.FC = () => {
  const { user, recordStudyMinutes } = useAuth();
  const [currentTab, setCurrentTab] = useState<'rooms' | 'my-rooms' | 'direct-messages' | 'analytics'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);

  // Global Pomodoro Timer State
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(2);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);

  // Pomodoro Interval Timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0) {
      setIsTimerRunning(false);
      if (pomodoroMode === 'focus') {
        setCompletedSessions((prev) => prev + 1);
        recordStudyMinutes(25);
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        alert('🎉 Awesome job! You completed a 25-minute focus session! 25 study minutes recorded.');
        setPomodoroMode('shortBreak');
        setPomodoroSeconds(5 * 60);
      } else {
        alert('☕ Break is over! Ready for the next focus sprint?');
        setPomodoroMode('focus');
        setPomodoroSeconds(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, pomodoroSeconds, pomodoroMode, recordStudyMinutes]);

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (pomodoroMode === 'focus') setPomodoroSeconds(25 * 60);
    else if (pomodoroMode === 'shortBreak') setPomodoroSeconds(5 * 60);
    else setPomodoroSeconds(15 * 60);
  };

  const handleChangeMode = (mode: 'focus' | 'shortBreak' | 'longBreak') => {
    setPomodoroMode(mode);
    setIsTimerRunning(false);
    if (mode === 'focus') setPomodoroSeconds(25 * 60);
    else if (mode === 'shortBreak') setPomodoroSeconds(5 * 60);
    else setPomodoroSeconds(15 * 60);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation */}
      <Navbar 
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedRoom(null);
          if (tab === 'direct-messages') {
            setIsDmModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        openPomodoro={() => setIsPomodoroOpen(true)}
        openAuthModal={() => setIsAuthModalOpen(true)}
        pomodoroSecondsLeft={pomodoroSeconds}
        isTimerRunning={isTimerRunning}
      />

      {/* Main View Body */}
      <main style={{ flex: 1 }}>
        {selectedRoom ? (
          <StudyRoomView 
            room={selectedRoom} 
            onBack={() => setSelectedRoom(null)} 
          />
        ) : (
          <RoomsExplorer 
            onSelectRoom={(room) => setSelectedRoom(room)} 
            myRoomsOnly={currentTab === 'my-rooms'}
          />
        )}
      </main>

      {/* Focus Timer Modal */}
      <PomodoroTimerModal 
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        secondsLeft={pomodoroSeconds}
        isRunning={isTimerRunning}
        onToggle={handleToggleTimer}
        onReset={handleResetTimer}
        mode={pomodoroMode}
        setMode={handleChangeMode}
        completedSessions={completedSessions}
      />

      {/* Direct Messages Modal */}
      <DirectMessagesModal 
        isOpen={isDmModalOpen}
        onClose={() => setIsDmModalOpen(false)}
      />

      {/* Sign In / Register Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
