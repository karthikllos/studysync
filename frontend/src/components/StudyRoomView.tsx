import React, { useState, useEffect, useRef } from 'react';
import { StudyRoom, ChatMessage, CollaborativeDocument, TaskItem, SharedResource, api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useWebSocket, PresenceUser } from '../hooks/useWebSocket';
import { 
  ArrowLeft, 
  MessageSquare, 
  FileText, 
  Palette, 
  CheckSquare, 
  FolderDown, 
  Send, 
  Code, 
  Paperclip, 
  Users, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Circle, 
  Square, 
  Eraser, 
  RotateCcw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudyRoomViewProps {
  room: StudyRoom;
  onBack: () => void;
}

export const StudyRoomView: React.FC<StudyRoomViewProps> = ({ room, onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'whiteboard' | 'tasks' | 'resources'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [snippetCode, setSnippetCode] = useState('');
  const [snippetLang, setSnippetLang] = useState('python');
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Notes State
  const [documents, setDocuments] = useState<CollaborativeDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<CollaborativeDocument | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');

  // Tasks State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newTaskAssignee, setNewTaskAssignee] = useState<number | null>(null);

  // Resources State
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResTitle, setNewResTitle] = useState('');
  const [newResType, setNewResType] = useState('Lecture Notes');
  const [newResUrl, setNewResUrl] = useState('');
  const [newResDesc, setNewResDesc] = useState('');

  // Whiteboard Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#15803d');
  const [brushSize, setBrushSize] = useState(3);
  const [activeTool, setActiveTool] = useState<'pen' | 'rect' | 'circle' | 'eraser'>('pen');
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // WebSocket Integration
  const {
    isConnected,
    activeUsers,
    activeTypers,
    sendChatMessage,
    sendTyping,
    sendDocUpdate,
    sendDrawStroke,
    clearBoard,
  } = useWebSocket({
    roomId: room.id,
    onChatMessage: (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    },
    onDocUpdate: (docEvt) => {
      if (activeDoc && activeDoc.id === docEvt.doc_id) {
        setNoteContent(docEvt.content);
        if (docEvt.title) setNoteTitle(docEvt.title);
      }
    },
    onDrawStroke: (stroke) => {
      drawExternalStroke(stroke);
    },
    onClearBoard: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
  });

  // Load initial room data
  useEffect(() => {
    // 1. Fetch chat history
    api.getRoomMessages(room.id).then((data) => {
      const msgs = Array.isArray(data) ? data : data.results || [];
      setMessages(msgs);
    });

    // 2. Fetch collaborative documents
    api.getRoomDocuments(room.id).then((data) => {
      const docs = Array.isArray(data) ? data : data.results || [];
      setDocuments(docs);
      if (docs.length > 0) {
        setActiveDoc(docs[0]);
        setNoteContent(docs[0].content);
        setNoteTitle(docs[0].title);
      }
    });

    // 3. Fetch Tasks
    api.getRoomTasks(room.id).then((data) => {
      const ts = Array.isArray(data) ? data : data.results || [];
      setTasks(ts);
    });

    // 4. Fetch Resources
    api.getRoomResources(room.id).then((data) => {
      const res = Array.isArray(data) ? data : data.results || [];
      setResources(res);
    });

    // 5. Fetch Whiteboard
    api.getWhiteboardState(room.id).then((wb) => {
      if (wb.elements_json && wb.elements_json !== '[]') {
        try {
          const elements = JSON.parse(wb.elements_json);
          renderWhiteboardElements(elements);
        } catch (e) {}
      }
    });
  }, [room.id]);

  // Scroll to bottom on new chat message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      sendTyping(false);
    }, 1500);
    setTypingTimeout(timeout);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendChatMessage(inputText, { message_type: 'TEXT' });
    sendTyping(false);
    setInputText('');
  };

  const handleSendCodeSnippet = () => {
    if (!snippetCode.trim()) return;
    sendChatMessage(snippetCode, {
      message_type: 'CODE',
      code_language: snippetLang,
    });
    setSnippetCode('');
    setIsCodeModalOpen(false);
  };

  // Note updates
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteContent(val);
    if (activeDoc) {
      sendDocUpdate(activeDoc.id, val, noteTitle);
    }
  };

  const handleNoteTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNoteTitle(val);
    if (activeDoc) {
      sendDocUpdate(activeDoc.id, noteContent, val);
    }
  };

  // Task Actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const task = await api.createTask({
        room: room.id,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        assigned_to_id: newTaskAssignee,
      });
      setTasks((prev) => [...prev, task]);
      setShowTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
    } catch (err) {
      console.error('Task create error', err);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (newStatus === 'DONE') {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Task update error', err);
    }
  };

  // Resource Actions
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle.trim() || !newResUrl.trim()) return;
    try {
      const created = await api.createResource({
        room: room.id,
        title: newResTitle,
        description: newResDesc,
        resource_type: newResType,
        file_url: newResUrl,
        file_size_bytes: 1450000,
      });
      setResources((prev) => [created, ...prev]);
      setShowResourceModal(false);
      setNewResTitle('');
      setNewResUrl('');
      setNewResDesc('');
    } catch (err) {
      console.error('Resource upload error', err);
    }
  };

  const handleDownloadResource = async (resourceId: string, url: string) => {
    try {
      await api.incrementResourceDownload(resourceId);
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, download_count: r.download_count + 1 } : r))
      );
      window.open(url, '_blank');
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // Whiteboard Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    if (activeTool === 'pen' || activeTool === 'eraser') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : brushColor;
      ctx.lineWidth = activeTool === 'eraser' ? brushSize * 4 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();

      sendDrawStroke({
        tool: activeTool,
        fromX: startPos?.x || x,
        fromY: startPos?.y || y,
        toX: x,
        toY: y,
        color: activeTool === 'eraser' ? '#ffffff' : brushColor,
        size: activeTool === 'eraser' ? brushSize * 4 : brushSize,
      });
      setStartPos({ x, y });
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas || !startPos) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'rect') {
      const w = x - startPos.x;
      const h = y - startPos.y;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.strokeRect(startPos.x, startPos.y, w, h);

      sendDrawStroke({
        tool: 'rect',
        x: startPos.x,
        y: startPos.y,
        width: w,
        height: h,
        color: brushColor,
        size: brushSize,
      });
    } else if (activeTool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      sendDrawStroke({
        tool: 'circle',
        x: startPos.x,
        y: startPos.y,
        radius,
        color: brushColor,
        size: brushSize,
      });
    }
    setStartPos(null);
  };

  const drawExternalStroke = (stroke: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !stroke) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.fromX, stroke.fromY);
      ctx.lineTo(stroke.toX, stroke.toY);
      ctx.stroke();
    } else if (stroke.tool === 'rect') {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
    } else if (stroke.tool === 'circle') {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      ctx.arc(stroke.x, stroke.y, stroke.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const renderWhiteboardElements = (elements: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    elements.forEach((el) => {
      if (el.type === 'rect') {
        ctx.fillStyle = el.color || '#3b82f6';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        if (el.label) {
          ctx.fillStyle = '#1e293b';
          ctx.font = '12px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(el.label, el.x + el.width / 2, el.y + el.height / 2 + 4);
        }
      } else if (el.type === 'circle') {
        ctx.fillStyle = el.color || '#ef4444';
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
        ctx.fill();
        if (el.label) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(el.label, el.x, el.y + 4);
        }
      } else if (el.type === 'arrow') {
        ctx.strokeStyle = el.color || '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(el.fromX, el.fromY);
        ctx.lineTo(el.toX, el.toY);
        ctx.stroke();
      }
    });
  };

  const handleClearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearBoard();
    api.saveWhiteboardState(room.id, '[]');
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 24px', height: 'calc(100vh - 74px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Room Header Banner */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Left: Back button & Room Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn btn-secondary btn-icon" onClick={onBack} title="Back to Rooms">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ background: 'rgba(21, 128, 61, 0.1)', color: '#166534', border: '1px solid rgba(21, 128, 61, 0.24)', fontSize: '0.8rem' }}>
                {room.course_code}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{room.name}</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Lead: {room.owner.first_name} {room.owner.last_name} • {room.members_count} Enrolled
            </p>
          </div>
        </div>

        {/* Center: Module Navigation Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-inset)', padding: '4px', borderRadius: '12px' }}>
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} 
            onClick={() => setActiveTab('chat')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <MessageSquare size={16} /> Live Chat
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('notes')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <FileText size={16} /> Shared Notes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`} 
            onClick={() => setActiveTab('whiteboard')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <Palette size={16} /> Whiteboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} 
            onClick={() => setActiveTab('tasks')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <CheckSquare size={16} /> Tasks ({tasks.filter(t => t.status !== 'DONE').length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`} 
            onClick={() => setActiveTab('resources')}
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <FolderDown size={16} /> Resources ({resources.length})
          </button>
        </div>

        {/* Right: Live Presence Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-online" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
            <span className="status-dot"></span>
            {activeUsers.length || 1} Online Now
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        
        {/* ================= TAB 1: LIVE CHAT ================= */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', width: '100%', height: '100%', gap: '14px' }}>
            
            {/* Chat Message Window */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Message Feed */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                    <p>No messages yet in this study room.</p>
                    <p style={{ fontSize: '0.8rem' }}>Say hello or share a lecture question with your classmates!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = user && msg.sender.id === user.id;
                    const isSystem = msg.message_type === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <div key={msg.id} style={{ textAlign: 'center', margin: '4px 0' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '3px 10px', borderRadius: '9999px' }}>
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={msg.id} 
                        style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          alignItems: 'flex-start',
                          maxWidth: '85%',
                          alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          flexDirection: isSelf ? 'row-reverse' : 'row'
                        }}
                      >
                        <img 
                          src={msg.sender.avatar_url} 
                          alt={msg.sender.username}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {msg.sender.full_name || msg.sender.username}
                            </span>
                            <span className={`badge ${msg.sender.role === 'INSTRUCTOR' ? 'badge-instructor' : msg.sender.role === 'TA' ? 'badge-ta' : 'badge-student'}`} style={{ fontSize: '0.55rem', padding: '1px 4px' }}>
                              {msg.sender.role}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Message Content Container */}
                          <div 
                            style={{ 
                              padding: '10px 14px', 
                              borderRadius: '14px', 
                              fontSize: '0.925rem',
                              lineHeight: '1.5',
                              background: isSelf ? 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))' : 'var(--bg-inset)',
                              border: isSelf ? '1px solid rgba(21, 128, 61, 0.4)' : '1px solid var(--border-subtle)',
                              color: isSelf ? '#ffffff' : 'var(--text-primary)',
                              borderTopRightRadius: isSelf ? '2px' : '14px',
                              borderTopLeftRadius: !isSelf ? '2px' : '14px',
                            }}
                          >
                            {msg.message_type === 'CODE' ? (
                              <div style={{ width: '100%', minWidth: '280px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--accent-indigo)' }}>
                                  <span className="code-font">{msg.code_language || 'code'}</span>
                                  <button 
                                    className="btn btn-secondary btn-sm" 
                                    style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                    onClick={() => navigator.clipboard.writeText(msg.content)}
                                  >
                                    <Copy size={12} /> Copy
                                  </button>
                                </div>
                                <pre className="code-font" style={{ background: '#e2e8f0', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem' }}>
                                  <code>{msg.content}</code>
                                </pre>
                              </div>
                            ) : (
                              <span>{msg.content}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator Bar */}
              {activeTypers.length > 0 && (
                <div style={{ padding: '4px 18px', fontSize: '0.75rem', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="status-dot" style={{ width: '4px', height: '4px' }}></span>
                  {activeTypers.join(', ')} {activeTypers.length > 1 ? 'are' : 'is'} typing...
                </div>
              )}

              {/* Chat Input Bar */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-icon"
                    onClick={() => setIsCodeModalOpen(true)}
                    title="Insert Code Snippet"
                  >
                    <Code size={18} />
                  </button>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder={`Message #${room.course_code}... (Press Enter to send)`}
                    value={inputText}
                    onChange={handleInputChange}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary btn-icon">
                    <Send size={18} />
                  </button>
                </form>
              </div>

            </div>

            {/* Online Members Sidebar */}
            <div className="glass-panel" style={{ width: '260px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  Active Peers ({activeUsers.length || 1})
                </span>
                <span className="status-dot"></span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
                {(activeUsers.length > 0 ? activeUsers : (user ? [{ id: user.id, username: user.username, full_name: `${user.first_name} ${user.last_name}`, avatar_url: user.avatar_url, role: user.role }] : [])).map((peer) => (
                  <div key={peer.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={peer.avatar_url} 
                        alt={peer.username}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span className="status-dot" style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--bg-primary)' }}></span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{peer.full_name || peer.username}</span>
                      <span className={`badge ${peer.role === 'INSTRUCTOR' ? 'badge-instructor' : peer.role === 'TA' ? 'badge-ta' : 'badge-student'}`} style={{ fontSize: '0.55rem', padding: '1px 4px', width: 'fit-content' }}>
                        {peer.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: COLLABORATIVE NOTES ================= */}
        {activeTab === 'notes' && (
          <div className="glass-panel" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '600px' }}>
                <FileText size={22} color="var(--accent-indigo)" />
                <input 
                  type="text" 
                  value={noteTitle} 
                  onChange={handleNoteTitleChange}
                  className="glass-input"
                  style={{ fontWeight: 700, fontSize: '1.1rem', padding: '6px 12px' }}
                  placeholder="Document Title..."
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-online">
                  <span className="status-dot"></span> Live WS Sync Active
                </span>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (activeDoc) {
                      api.updateDocument(activeDoc.id, { title: noteTitle, content: noteContent });
                      alert('Notes saved to cloud database!');
                    }
                  }}
                >
                  Save Snapshot
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', overflow: 'hidden' }}>
              {/* Markdown Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Markdown Source Editor
                </div>
                <textarea 
                  className="glass-input code-font"
                  value={noteContent}
                  onChange={handleNoteChange}
                  style={{ flex: 1, resize: 'none', lineHeight: '1.6', fontSize: '0.9rem', padding: '14px' }}
                  placeholder="Type notes in Markdown format..."
                />
              </div>

              {/* Rendered Markdown Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Formatted Preview
                </div>
                <div 
                  className="glass-card" 
                  style={{ flex: 1, padding: '16px', overflowY: 'auto', background: 'var(--bg-secondary)', lineHeight: '1.6', fontSize: '0.925rem' }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {noteContent}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: INTERACTIVE WHITEBOARD ================= */}
        {activeTab === 'whiteboard' && (
          <div className="glass-panel" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
            
            {/* Whiteboard Controls Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              
              {/* Tools */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-inset)', padding: '4px', borderRadius: '8px' }}>
                <button 
                  className={`btn btn-sm ${activeTool === 'pen' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTool('pen')}
                >
                  <Palette size={14} /> Pen
                </button>
                <button 
                  className={`btn btn-sm ${activeTool === 'rect' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTool('rect')}
                >
                  <Square size={14} /> Rect
                </button>
                <button 
                  className={`btn btn-sm ${activeTool === 'circle' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTool('circle')}
                >
                  <Circle size={14} /> Circle
                </button>
                <button 
                  className={`btn btn-sm ${activeTool === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTool('eraser')}
                >
                  <Eraser size={14} /> Eraser
                </button>
              </div>

              {/* Color Palette */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: color,
                      border: brushColor === color ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      boxShadow: brushColor === color ? `0 0 10px ${color}` : 'none'
                    }}
                  />
                ))}
              </div>

              {/* Brush Size Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thickness:</span>
                <input 
                  type="range" 
                  min="1" 
                  max="12" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  style={{ width: '80px', cursor: 'pointer' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleClearWhiteboard}>
                  <RotateCcw size={14} /> Clear Canvas
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div style={{ flex: 1, position: 'relative', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              <canvas 
                ref={canvasRef}
                width={1200}
                height={650}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ width: '100%', height: '100%', cursor: activeTool === 'eraser' ? 'cell' : 'crosshair' }}
              />
            </div>

          </div>
        )}

        {/* ================= TAB 4: KANBAN TASKS ================= */}
        {activeTab === 'tasks' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Coursework & Task Kanban</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track problem sets, reading assignments, and project deliverables.</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
                <Plus size={16} /> New Task
              </button>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', overflow: 'hidden' }}>
              
              {/* Columns: TODO, IN_PROGRESS, DONE */}
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((statusKey) => {
                const columnTasks = tasks.filter((t) => t.status === statusKey);
                const colTitle = statusKey === 'TODO' ? 'To Do' : statusKey === 'IN_PROGRESS' ? 'In Progress' : 'Completed';
                const badgeColor = statusKey === 'TODO' ? 'var(--accent-amber)' : statusKey === 'IN_PROGRESS' ? 'var(--accent-indigo)' : 'var(--accent-emerald)';

                return (
                  <div key={statusKey} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '14px', overflow: 'hidden' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: badgeColor }}></span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{colTitle}</span>
                      </div>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                        {columnTasks.length}
                      </span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {columnTasks.map((task) => (
                        <div key={task.id} className="glass-card" style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                            <span className="badge" style={{ 
                              background: task.priority === 'HIGH' ? 'rgba(244, 63, 94, 0.2)' : task.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(21, 128, 61, 0.1)',
                              color: task.priority === 'HIGH' ? '#f43f5e' : task.priority === 'MEDIUM' ? '#a16207' : '#166534',
                              fontSize: '0.65rem'
                            }}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.4' }}>
                              {task.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {task.assigned_to ? `Assigned: ${task.assigned_to.first_name || task.assigned_to.username}` : 'Unassigned'}
                            </div>

                            {/* Move state select */}
                            <select 
                              value={task.status} 
                              onChange={(e: any) => handleTaskStatusChange(task.id, e.target.value)}
                              className="glass-input"
                              style={{ width: 'auto', padding: '2px 6px', fontSize: '0.75rem' }}
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}

            </div>

          </div>
        )}

        {/* ================= TAB 5: SHARED RESOURCES ================= */}
        {activeTab === 'resources' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Academic Materials & Resource Vault</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lecture slides, homework templates, annotated research papers, and cheat sheets.</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowResourceModal(true)}>
                <Plus size={16} /> Upload Resource
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {resources.map((res) => (
                <div key={res.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge" style={{ background: 'rgba(21, 128, 61, 0.1)', color: 'var(--accent-indigo)', fontSize: '0.7rem' }}>
                      {res.resource_type}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(res.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{res.title}</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', flex: 1, marginBottom: '14px', lineHeight: '1.45' }}>
                    {res.description || 'Shared academic resource for course study.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      By {res.uploaded_by.first_name || res.uploaded_by.username} • {res.download_count} DLs
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDownloadResource(res.id, res.file_url)}
                    >
                      <Download size={14} /> Open / Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* Code Snippet Modal */}
      {isCodeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-backdrop)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Insert Code Snippet</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Programming Language</label>
              <select className="glass-input" value={snippetLang} onChange={(e) => setSnippetLang(e.target.value)}>
                <option value="python">Python (PyTorch / NumPy / Algorithms)</option>
                <option value="typescript">TypeScript / JavaScript</option>
                <option value="cpp">C++ / Systems</option>
                <option value="sql">PostgreSQL / SQL</option>
                <option value="latex">LaTeX Math</option>
              </select>
            </div>
            <textarea 
              className="glass-input code-font" 
              rows={8}
              placeholder="Paste or write code here..."
              value={snippetCode}
              onChange={(e) => setSnippetCode(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCodeModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSendCodeSnippet}>Send Snippet</button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-backdrop)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px' }}>Create Course Task</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Task Title *</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Implement A* Search Algorithm" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Description</label>
                <textarea 
                  className="glass-input" 
                  rows={3} 
                  placeholder="Task specifications..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Priority</label>
                <select 
                  className="glass-input" 
                  value={newTaskPriority} 
                  onChange={(e: any) => setNewTaskPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High / Urgent</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Resource Modal */}
      {showResourceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-backdrop)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px' }}>Share Academic Resource</h3>
            <form onSubmit={handleCreateResource} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Resource Title *</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Midterm Formula Sheet PDF" 
                  value={newResTitle}
                  onChange={(e) => setNewResTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Resource Type</label>
                <select 
                  className="glass-input" 
                  value={newResType} 
                  onChange={(e) => setNewResType(e.target.value)}
                >
                  <option value="Lecture Notes">Lecture Notes</option>
                  <option value="Research Paper">Research Paper</option>
                  <option value="Cheat Sheet">Cheat Sheet</option>
                  <option value="Assignment Solution">Assignment Solution</option>
                  <option value="Code Repository">Code Repository</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>File URL / Link *</label>
                <input 
                  type="url" 
                  className="glass-input" 
                  placeholder="https://..." 
                  value={newResUrl}
                  onChange={(e) => setNewResUrl(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Description</label>
                <textarea 
                  className="glass-input" 
                  rows={2} 
                  placeholder="What is inside this resource?"
                  value={newResDesc}
                  onChange={(e) => setNewResDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowResourceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Share</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
