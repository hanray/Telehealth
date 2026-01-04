import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Form,
  Button,
  ListGroup,
  Badge,
  Alert,
  InputGroup,
  Spinner,
} from 'react-bootstrap';

const API_BASE =
  process.env.NODE_ENV === 'production'
    ? window.location.origin
    : (process.env.REACT_APP_API_BASE || 'http://localhost:5000');

const asArray = (maybe, key) => {
  if (Array.isArray(maybe)) return maybe;
  if (maybe && key && Array.isArray(maybe[key])) return maybe[key];
  return [];
};

const safeTime = (t) => {
  const d = new Date(t || Date.now());
  const today = new Date();
  if (d.toString() === 'Invalid Date') return '';
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString();
};

const fetchWithTimeout = (url, options = {}, ms = 12000) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {
    credentials: 'include',
    ...options,
    signal: ctrl.signal,
  }).finally(() => clearTimeout(t));
};

const ChatModule = ({ show, onHide, currentUser, recipients = [] }) => {
  const [providers, setProviders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const listRef = useRef(null);

  const api = (path) => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  useEffect(() => {
    if (!show) return;

    if (Array.isArray(recipients) && recipients.length) {
      setProviders(recipients);
      return;
    }

    const loadProviders = async () => {
      setLoadingProviders(true);
      setError('');
      try {
        const r = await fetchWithTimeout(api('/api/messages/providers'));
        const data = await r.json();
        setProviders(asArray(data, 'providers'));
      } catch (e) {
        setError(`Error fetching providers: ${e?.message || String(e)}`);
        setProviders([]);
      } finally {
        setLoadingProviders(false);
      }
    };

    loadProviders();
  }, [show, recipients]);

  useEffect(() => {
    if (!show || !currentUser?.id) return;

    const loadConversations = async () => {
      setLoadingConvos(true);
      setError('');
      try {
        const r = await fetchWithTimeout(api(`/api/messages/conversations/${currentUser.id}`));
        const data = await r.json();
        setConversations(asArray(data, 'conversations'));
      } catch (e) {
        setError(`Error fetching conversations: ${e?.message || String(e)}`);
        setConversations([]);
      } finally {
        setLoadingConvos(false);
      }
    };

    loadConversations();
  }, [show, currentUser]);

  const loadMessages = async (partnerId) => {
    if (!currentUser?.id || !partnerId) return;
    setLoadingMessages(true);
    setError('');
    try {
      const url = api(`/api/messages/messages/${currentUser.id}/${partnerId}`);
      const r = await fetchWithTimeout(url);
      const data = await r.json();
      const uniq = Array.from(new Map(asArray(data, 'messages').map((m) => [m._id || `${m.senderId}|${m.recipientId}|${m.timestamp || m.createdAt}`, m])).values());
      uniq.sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
      setMessages(uniq);
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 0);
    } catch (e) {
      setError(`Error fetching messages: ${e?.message || String(e)}`);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const pickPartner = (p) => {
    setActivePartner(p);
    loadMessages(p.id || p.userId || p.providerId || p.username);
  };

  const sendMessage = async () => {
    if (!currentUser?.id || !activePartner) return;
    const partnerId = activePartner.id || activePartner.userId || activePartner.providerId || activePartner.username;
    if (!partnerId || !draft.trim()) return;

    const payload = {
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.email || 'Me',
      senderRole: currentUser.role,
      recipientId: partnerId,
      recipientName: activePartner.name || activePartner.displayName || 'Recipient',
      recipientRole: activePartner.role || 'doctor',
      message: draft.trim(),
      messageType: 'text',
      priority: 'normal',
    };

    try {
      setError('');
      const r = await fetchWithTimeout(api('/api/messages/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(text || `HTTP ${r.status}`);
      }
      setDraft('');
      await loadMessages(partnerId);
      setConversations((prev) => {
        const now = new Date().toISOString();
        const entry = {
          userId: partnerId,
          userName: payload.recipientName,
          lastMessage: payload.message,
          lastMessageTime: now,
          unreadCount: 0,
        };
        const map = new Map(prev.map((c) => [c.userId || c.id, c]));
        map.set(partnerId, entry);
        return Array.from(map.values()).sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
      });
    } catch (e) {
      setError(`Error sending message: ${e?.message || String(e)}`);
    }
  };

  const Busy = ({ on }) => (on ? <Spinner animation="border" size="sm" className="ms-2" /> : null);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Secure Chat</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex gap-3">
          <div style={{ width: 260 }}>
            <div className="d-flex align-items-center mb-2">
              <strong>Contacts</strong>
              <Busy on={loadingProviders || loadingConvos} />
            </div>

            <ListGroup>
              {providers.map((p, idx) => (
                <ListGroup.Item
                  key={p.id || p.userId || p.providerId || p.username || idx}
                  action
                  active={(activePartner?.id || activePartner?.userId) === (p.id || p.userId)}
                  onClick={() => pickPartner(p)}
                >
                  <div className="d-flex justify-content-between">
                    <span>{p.name || p.displayName || p.username || 'Unknown'}</span>
                    {p.role && <Badge bg="secondary">{p.role}</Badge>}
                  </div>
                </ListGroup.Item>
              ))}
              {!providers.length && !loadingProviders && (
                <ListGroup.Item className="text-muted">No contacts found.</ListGroup.Item>
              )}
            </ListGroup>
          </div>

          <div className="flex-grow-1">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <strong>
                {activePartner ? (activePartner.name || activePartner.displayName || activePartner.username) : 'Select a contact'}
              </strong>
              <Busy on={loadingMessages} />
            </div>

            <div
              ref={listRef}
              style={{
                height: 320,
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 10,
              }}
            >
              {messages.map((m, idx) => {
                const mine = m.senderId === currentUser?.id;
                return (
                  <div key={m._id || idx} className={`mb-2 d-flex ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div style={{ maxWidth: '75%' }}>
                      <div
                        style={{
                          padding: '8px 10px',
                          borderRadius: 10,
                          background: mine ? '#0d6efd' : '#f1f5f9',
                          color: mine ? '#fff' : '#0f172a',
                        }}
                      >
                        <div style={{ fontSize: 12, opacity: mine ? 0.85 : 0.75 }}>
                          {safeTime(m.timestamp || m.createdAt)}
                        </div>
                        <div>{m.message || m.text || ''}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!messages.length && activePartner && !loadingMessages && (
                <div className="text-muted">No messages yet.</div>
              )}
            </div>

            <InputGroup className="mt-2">
              <Form.Control
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={!activePartner}
              />
              <Button onClick={sendMessage} disabled={!activePartner || !draft.trim()}>
                Send
              </Button>
            </InputGroup>

            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
              API base: {API_BASE}
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChatModule;
