import React, { useState, useEffect, useRef } from 'react';
import { User, DirectMessage, api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Users, X, Search, Check, ShieldCheck } from 'lucide-react';

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getUsers().then((data) => {
        const uList = Array.isArray(data) ? data : data.results || [];
        const otherUsers = uList.filter((u) => u.id !== user?.id);
        setUsers(otherUsers);
        if (otherUsers.length > 0 && !selectedUser) {
          setSelectedUser(otherUsers[0]);
        }
      });
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedUser) {
      api.getDirectMessages(selectedUser.id).then((data) => {
        const msgs = Array.isArray(data) ? data : data.results || [];
        setMessages(msgs);
        api.markDirectMessagesRead(selectedUser.id);
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedUser) return;
    try {
      const msg = await api.sendDirectMessage(selectedUser.id, inputMsg);
      setMessages((prev) => [...prev, msg]);
      setInputMsg('');
    } catch (e) {
      console.error('Failed to send direct message', e);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) =>
    (u.first_name + ' ' + u.last_name + ' ' + u.username + ' ' + u.role).toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-backdrop)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', height: '620px', display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* Left: Peers & Faculty List */}
        <div style={{ width: '280px', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', background: 'var(--bg-inset)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px' }}>Direct Messages</h3>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                className="glass-input"
                placeholder="Search peers or faculty..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 10px 6px 30px' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px' }}>
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: selectedUser?.id === u.id ? 'var(--bg-active)' : 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={u.avatar_url} alt={u.username} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  {u.is_online && <span className="status-dot" style={{ position: 'absolute', bottom: 0, right: 0 }}></span>}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.first_name} {u.last_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span className={`badge ${u.role === 'INSTRUCTOR' ? 'badge-instructor' : u.role === 'TA' ? 'badge-ta' : 'badge-student'}`} style={{ fontSize: '0.55rem', padding: '1px 4px' }}>
                      {u.role}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.major_or_department || u.institution}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Conversation Feed */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {selectedUser ? (
            <>
              {/* DM Header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={selectedUser.avatar_url} alt={selectedUser.username} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedUser.first_name} {selectedUser.last_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedUser.institution}</div>
                  </div>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* DM Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                    <MessageSquare size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p>Start a 1-on-1 academic conversation with {selectedUser.first_name}.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = user && m.sender.id === user.id;
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: isSelf ? 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))' : 'var(--bg-inset)',
                          color: isSelf ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.9rem',
                          lineHeight: '1.45',
                          borderTopRightRadius: isSelf ? '2px' : '12px',
                          borderTopLeftRadius: !isSelf ? '2px' : '12px'
                        }}
                      >
                        {m.content}
                        <div style={{ fontSize: '0.65rem', color: isSelf ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* DM Input */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <form onSubmit={handleSendDM} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder={`Message ${selectedUser.first_name}...`}
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary btn-icon">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Select a peer or instructor to begin chatting
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
