import React, { useState, useEffect } from 'react';
import { StudyRoom, api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Plus, 
  Users, 
  Lock, 
  Unlock, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  Cpu, 
  Brain, 
  Calculator, 
  Atom, 
  FlaskConical,
  GraduationCap
} from 'lucide-react';

interface RoomsExplorerProps {
  onSelectRoom: (room: StudyRoom) => void;
  myRoomsOnly?: boolean;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Subjects', icon: BookOpen },
  { id: 'AI', label: 'AI & Machine Learning', icon: Brain },
  { id: 'CS', label: 'Computer Science', icon: Cpu },
  { id: 'MATH', label: 'Mathematics', icon: Calculator },
  { id: 'ENG', label: 'Physics & Engineering', icon: Atom },
  { id: 'SCI', label: 'Biology & Chemistry', icon: FlaskConical },
];

export const RoomsExplorer: React.FC<RoomsExplorerProps> = ({ onSelectRoom, myRoomsOnly = false }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New room form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState<'CS' | 'AI' | 'MATH' | 'ENG' | 'SCI' | 'GEN'>('CS');
  const [newDesc, setNewDesc] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await api.getRooms(selectedCategory, search, myRoomsOnly);
      const results = Array.isArray(data) ? data : data.results || [];
      setRooms(results);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedCategory, search, myRoomsOnly]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) return;
    setCreating(true);
    try {
      const created = await api.createRoom({
        name: newName,
        course_code: newCode.toUpperCase(),
        category: newCategory,
        description: newDesc,
        is_private: newIsPrivate,
        passcode: newPasscode,
        banner_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      });
      setShowCreateModal(false);
      setNewName('');
      setNewCode('');
      setNewDesc('');
      fetchRooms();
      onSelectRoom(created);
    } catch (err: any) {
      alert(err.message || 'Failed to create study room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinOrEnter = async (room: StudyRoom) => {
    if (room.is_joined) {
      onSelectRoom(room);
    } else {
      let passcode = '';
      if (room.is_private) {
        passcode = prompt('This room is private. Please enter the passcode:') || '';
      }
      try {
        await api.joinRoom(room.id, passcode);
        const updated = await api.getRoom(room.id);
        onSelectRoom(updated);
      } catch (err: any) {
        alert(err.message || 'Failed to join room');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Hero Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={18} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Academic Collaboration Hubs
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {myRoomsOnly ? 'My Enrolled Study Groups' : 'Explore Virtual Study Rooms'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '1rem' }}>
            Join live course channels with real-time WebSockets chat, synchronized notes, and whiteboard sessions.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ padding: '12px 20px', fontSize: '0.95rem' }}
        >
          <Plus size={18} />
          Create Study Room
        </button>
      </div>

      {/* Category Pills & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', maxWidth: '600px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          <input 
            type="text"
            className="glass-input"
            placeholder="Search by course code (e.g. CS229, MATH51), topic, or instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '42px', fontSize: '0.95rem' }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'linear-gradient(135deg, rgba(21, 128, 61, 0.14), rgba(5, 150, 105, 0.12))' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(21, 128, 61, 0.16)' : 'none'
                }}
              >
                <Icon size={16} color={isSelected ? 'var(--accent-indigo)' : 'var(--text-muted)'} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="status-dot"></span> Loading real-time study rooms...
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h3>No study rooms found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Try tweaking your search term or create a new collaboration room for your course!
          </p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '20px' }}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> Create Room
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {rooms.map((room) => (
            <div 
              key={room.id} 
              className="glass-card"
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onClick={() => handleJoinOrEnter(room)}
            >
              {/* Room Banner */}
              <div style={{ height: '120px', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={room.banner_url} 
                  alt={room.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'linear-gradient(to top, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.08) 100%)'
                }} />
                
                {/* Course Code Badge */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(8px)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', padding: '4px 10px' }}>
                    {room.course_code}
                  </span>
                  {room.is_private ? (
                    <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}>
                      <Lock size={12} /> Private
                    </span>
                  ) : (
                    <span className="badge badge-online" style={{ fontSize: '0.7rem' }}>
                      <Unlock size={12} /> Public
                    </span>
                  )}
                </div>

                {/* Member Count */}
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(8px)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <Users size={12} /> {room.members_count} members
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                  {room.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.45', flex: 1, marginBottom: '16px' }}>
                  {room.description || 'Collaborative study space for coursework, assignment prep, and live problem solving.'}
                </p>

                {/* Card Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={room.owner.avatar_url} 
                      alt={room.owner.username}
                      style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Lead: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{room.owner.first_name || room.owner.username}</span>
                    </div>
                  </div>

                  <button 
                    className={`btn btn-sm ${room.is_joined ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinOrEnter(room);
                    }}
                  >
                    {room.is_joined ? 'Enter Room' : 'Join Room'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-backdrop)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
              Create New Study Room
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              Create a dedicated collaboration room for your class, subject, or study squad.
            </p>

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Course Code *
                </label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. CS229, MATH51, PHYS21" 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Room Title *
                </label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Machine Learning & Neural Nets" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Subject Category
                </label>
                <select 
                  className="glass-input"
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                >
                  <option value="CS">Computer Science</option>
                  <option value="AI">AI & Machine Learning</option>
                  <option value="MATH">Mathematics</option>
                  <option value="ENG">Physics & Engineering</option>
                  <option value="SCI">Biology & Chemistry</option>
                  <option value="GEN">General Study</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Description & Objective
                </label>
                <textarea 
                  className="glass-input" 
                  rows={3}
                  placeholder="What topics or assignments will be covered here?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="private-check"
                  checked={newIsPrivate}
                  onChange={(e) => setNewIsPrivate(e.target.checked)}
                />
                <label htmlFor="private-check" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                  Make this room private (requires passcode)
                </label>
              </div>

              {newIsPrivate && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Room Passcode
                  </label>
                  <input 
                    type="password" 
                    className="glass-input" 
                    placeholder="Enter private passcode"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Launch Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
