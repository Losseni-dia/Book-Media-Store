import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const AUTH_KEY = "bookea_auth_token";
const WS_URL = "http://localhost:8080/ws-chat";
const CHAT_TOPIC = "/topic/room/1";
const SEND_DEST = "/app/chat.send/1";
const HISTORY_URL = "http://localhost:8080/api/chat/rooms/1/messages";
const ROOM_ID = 1;

type ChatMessage = {
  id?: number;
  content: string;
  senderUsername?: string;
  roomId?: number;
  sentAt?: string;
  type?: string;
};

function getUsernameFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function colorForUsername(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 72%, 62%)`;
}

const LiveChat: React.FC = () => {
  const [token] = useState<string | null>(() =>
    localStorage.getItem(AUTH_KEY)
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const username = useMemo(() => getUsernameFromToken(token), [token]);
  const canParticipate = Boolean(token && username);

  const viewerCount = useMemo(
    () => Math.floor(120 + Math.random() * 8880),
    []
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const authHeaders = useCallback((): HeadersInit => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(HISTORY_URL, { headers: authHeaders() });
        if (!res.ok) return;
        const data = (await res.json()) as ChatMessage[];
        if (!cancelled && Array.isArray(data)) setMessages(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, authHeaders]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      setWsConnected(true);
      client.subscribe(CHAT_TOPIC, (message: IMessage) => {
        try {
          const body = JSON.parse(message.body) as ChatMessage;
          setMessages((prev) => [...prev, body]);
        } catch {
          /* ignore */
        }
      });
    };

    client.onDisconnect = () => setWsConnected(false);
    client.onStompError = () => setWsConnected(false);
    client.onWebSocketClose = () => setWsConnected(false);

    clientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [token]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !username || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: SEND_DEST,
      body: JSON.stringify({
        content,
        senderUsername: username,
        roomId: ROOM_ID,
      }),
    });
    setDraft("");
  };

  const shell: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#0e0e10",
    color: "#efeff1",
    fontFamily:
      'Inter, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: "flex",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  };

  const panel: React.CSSProperties = {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#18181b",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    maxHeight: "calc(100vh - 32px)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
    overflow: "hidden",
  };

  const header: React.CSSProperties = {
    padding: "12px 14px",
    borderBottom: "1px solid #2d2d32",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  };

  const badgeLive: React.CSSProperties = {
    backgroundColor: "#00a870",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
    padding: "3px 6px",
    borderRadius: 4,
  };

  const msgArea: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.45,
  };

  const footer: React.CSSProperties = {
    borderTop: "1px solid #2d2d32",
    padding: "10px 12px",
    flexShrink: 0,
  };

  const connDot = (ok: boolean): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: ok ? "#00f593" : "#e91916",
    flexShrink: 0,
  });

  return (
    <div style={shell}>
      <div style={panel}>
        <div style={header}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>LIVE CHAT</span>
          <span style={badgeLive}>EN DIRECT</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "#adadb8",
            }}
          >
            {viewerCount.toLocaleString("fr-FR")} viewers
          </span>
        </div>

        <div style={msgArea}>
          {messages.map((m, i) => {
            const name = m.senderUsername ?? "?";
            const key = m.id ?? `${i}-${m.sentAt ?? ""}-${m.content}`;
            return (
              <div key={key} style={{ marginBottom: 8 }}>
                <span style={{ color: colorForUsername(name), fontWeight: 600 }}>
                  {name}
                </span>
                <span style={{ color: "#adadb8" }}>: </span>
                <span style={{ color: "#efeff1" }}>{m.content}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={footer}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              fontSize: 12,
              color: "#adadb8",
            }}
          >
            <span style={connDot(wsConnected)} />
            <span>
              {wsConnected ? "Connecté au chat" : "Déconnecté du serveur"}
            </span>
          </div>

          {!canParticipate ? (
            <div
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: 6,
                backgroundColor: "#2d2d32",
                color: "#a1a1aa",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Connecte-toi sur le site pour participer au chat
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Envoyer un message"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #3d3d44",
                  backgroundColor: "#0e0e10",
                  color: "#efeff1",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#f97316",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Envoyer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChat;
