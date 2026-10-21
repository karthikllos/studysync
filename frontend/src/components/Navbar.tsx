import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  MessageSquare, 
  CheckSquare, 
  Clock, 
  Users, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'rooms' | 'my-rooms' | 'direct-messages' | 'analytics';
  setCurrentTab: (tab: 'rooms' | 'my-rooms' | 'direct-messages' | 'analytics') => void;
  openPomodoro: () => void;
  openAuthModal: () => void;
  pomodoroSecondsLeft: number;
  isTimerRunning: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openPomodoro,
  openAuthModal,
  pomodoroSecondsLeft,
  isTimerRunning,
}) => {
  const { user, isAuthenticated, logout, quickDemoLogin } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const demoAccounts = [
    { name: 'Prof. Alan Turing', email: 'alan@mit.edu', role: 'INSTRUCTOR', label: 'Instructor / ML' },
    { name: 'Dr. Grace Hopper', email: 'grace@mit.edu', role: 'INSTRUCTOR', label: 'Instructor / Algo' },
    { name: 'Alex Chen', email: 'alex@stanford.edu', role: 'STUDENT', label: 'Student / CS Senior' },
    { name: 'Marcus Aurelius', email: 'marcus@stanford.edu', role: 'TA', label: 'Teaching Assistant' },
    { name: 'Sarah Jenkins', email: 'sarah@stanford.edu', role: 'STUDENT', label: 'Student / Data Sci' },
  ];

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setCurrentTab('rooms')}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(21, 128, 61, 0.3)'
          }}>
            <BookOpen size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">
                StudySync
              </span>
              <span className="badge badge-online" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                <span className="status-dot" style={{ width: '5px', height: '5px' }}></span>
                ASGI &lt;100ms
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Real-Time Academic Collaboration
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className={`tab-btn ${currentTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setCurrentTab('rooms')}
          >
            <BookOpen size={16} />
            Study Hubs
          </button>
          
          {isAuthenticated && (
            <>
              <button 
                className={`tab-btn ${currentTab === 'my-rooms' ? 'active' : ''}`}
                onClick={() => setCurrentTab('my-rooms')}
              >
                <Users size={16} />
                My Groups
              </button>
              <button 
                className={`tab-btn ${currentTab === 'direct-messages' ? 'active' : ''}`}
                onClick={() => setCurrentTab('direct-messages')}
              >
                <MessageSquare size={16} />
                Direct Chat
              </button>
            </>
          )}
        </nav>

        {/* Right Section: Focus Timer + Role Switcher + Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Pomodoro Focus Pill */}
          <button 
            className="btn btn-secondary"
            onClick={openPomodoro}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 14px', 
              borderRadius: '9999px',
              borderColor: isTimerRunning ? 'var(--accent-emerald)' : 'var(--border-subtle)',
              background: isTimerRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <Clock size={16} color={isTimerRunning ? '#10b981' : 'var(--text-secondary)'} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isTimerRunning ? '#047857' : 'var(--text-primary)' }}>
              {formatTimer(pomodoroSecondsLeft)}
            </span>
          </button>

          {/* Role Switcher & User Profile */}
          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '4px 10px 4px 4px', 
                  borderRadius: '9999px', 
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={user.avatar_url} 
                  alt={user.username}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.first_name || user.username}</span>
                  <span className={`badge ${user.role === 'INSTRUCTOR' ? 'badge-instructor' : user.role === 'TA' ? 'badge-ta' : 'badge-student'}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                    {user.role}
                  </span>
                </div>
                <ChevronDown size={14} color="var(--text-secondary)" />
              </div>

              {/* Role & Switcher Dropdown */}
              {showRoleDropdown && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    position: 'absolute', 
                    top: '48px', 
                    right: 0, 
                    width: '280px', 
                    padding: '12px', 
                    zIndex: 200,
                    boxShadow: 'var(--shadow-lg)'
                  }}
                >
                  <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Active Academic Profile
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>{user.first_name} {user.last_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.institution || user.email}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <span className="badge badge-online">🔥 {user.study_streak_days}d Streak</span>
                      <span className="badge badge-student">⏱️ {Math.round(user.total_study_minutes / 60)}h Studied</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Quick Demo Role Switcher
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => {
                          quickDemoLogin(acc.email);
                          setShowRoleDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: user.email === acc.email ? 'var(--bg-active)' : 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{acc.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{acc.label}</div>
                        </div>
                        <span className={`badge ${acc.role === 'INSTRUCTOR' ? 'badge-instructor' : acc.role === 'TA' ? 'badge-ta' : 'badge-student'}`} style={{ fontSize: '0.6rem' }}>
                          {acc.role}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '8px', paddingTop: '8px' }}>
                    <button 
                      onClick={() => {
                        logout();
                        setShowRoleDropdown(false);
                      }}
                      className="btn btn-danger btn-sm" 
                      style={{ width: '100%' }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={openAuthModal}>
              <ShieldCheck size={16} />
              Sign In / Register
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
