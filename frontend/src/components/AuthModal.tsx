import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Building, GraduationCap, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, quickDemoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'TA'>('STUDENT');
  const [institution, setInstitution] = useState('Stanford University');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({
          username: username || email.split('@')[0],
          email,
          password,
          password_confirm: passwordConfirm,
          first_name: firstName,
          last_name: lastName,
          role,
          institution,
        });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async (demoEmail: string) => {
    await quickDemoLogin(demoEmail);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-backdrop)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: 'linear-gradient(135deg, rgba(21, 128, 61, 0.14), rgba(5, 150, 105, 0.12))', borderRadius: '12px', marginBottom: '10px' }}>
            <GraduationCap size={28} color="var(--accent-indigo)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {isRegister ? 'Create Academic Account' : 'Welcome back to StudySync'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isRegister ? 'Join your university collaboration network' : 'Sign in to access your study rooms and live chats'}
          </p>
        </div>

        {/* Quick Demo Logins */}
        <div style={{ background: 'var(--bg-inset)', padding: '12px', borderRadius: '12px', marginBottom: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', textAlign: 'center' }}>
            ⚡ 1-Click Demo Login
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleDemoClick('alan@mit.edu')}>
              👨‍🏫 Prof. Turing (ML)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleDemoClick('grace@mit.edu')}>
              👩‍🏫 Dr. Hopper (Algo)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleDemoClick('alex@stanford.edu')}>
              🧑‍🎓 Alex (Student)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleDemoClick('marcus@stanford.edu')}>
              🧑‍💻 Marcus (TA)
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '0.825rem', marginBottom: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {isRegister && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>First Name</label>
                  <input type="text" className="glass-input" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Alex" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Last Name</label>
                  <input type="text" className="glass-input" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Chen" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Role / Access Level</label>
                <select className="glass-input" value={role} onChange={(e: any) => setRole(e.target.value)}>
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor / Faculty</option>
                  <option value="TA">Teaching Assistant (TA)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Institution</label>
                <input type="text" className="glass-input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Stanford University" />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Email Address</label>
            <input type="email" className="glass-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@university.edu" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Password</label>
            <input type="password" className="glass-input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Confirm Password</label>
              <input type="password" className="glass-input" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="••••••••" />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '12px' }} disabled={submitting}>
            {submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <a href="#login" onClick={(e) => { e.preventDefault(); setIsRegister(false); }} style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>
                Sign In
              </a>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <a href="#register" onClick={(e) => { e.preventDefault(); setIsRegister(true); }} style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>
                Register Free
              </a>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
