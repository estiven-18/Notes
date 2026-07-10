import { useState, useEffect } from "react";
import { getNotifications, acceptInvitation, rejectInvitation, markNotificationRead, markAllNotificationsRead } from "../services/api";
import ModalPortal from "./ModalPortal";

const NotificationBell = ({ onRefresh, isOpen, onToggle, onUnreadCount }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const show = isOpen !== undefined ? isOpen : open;
  const setShow = (val) => {
    if (onToggle) onToggle(val);
    else setOpen(val);
  };

  const load = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      if (onUnreadCount) onUnreadCount(data.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
      if (onUnreadCount) onUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void load();
    }, 0);
    const interval = setInterval(() => {
      void load();
    }, 10000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!show) return;
    const refreshTimer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(refreshTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleAccept = async (id) => {
    try {
      await acceptInvitation(id);
      await load();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectInvitation(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRead = async (id) => {
    await markNotificationRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "ahora";
    if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `hace ${Math.floor(diff / 86400000)}d`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const getInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      {!onToggle && (
        <div className="notification-bell-wrapper">
          <button
            className="notification-bell"
            onClick={() => setShow(true)}
            title="Notificaciones"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
        </div>
      )}

      {show && (
        <ModalPortal>
          <div className="confirm-overlay" onClick={() => setShow(false)}>
            <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
              <div className="notif-header">
                <div className="notif-header-left">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <h3>Notificaciones</h3>
                  {unreadCount > 0 && <span className="notif-unread-pill">{unreadCount}</span>}
                </div>
                <div className="notif-header-right">
                  {unreadCount > 0 && (
                    <button className="notif-mark-all" onClick={handleMarkAllRead}>
                      Marcar todo leído
                    </button>
                  )}
                </div>
              </div>

              <div className="notif-body">
                {loading ? (
                  <div className="notif-empty">
                    <div className="notif-empty-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="32" height="32">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                      </svg>
                    </div>
                    <span>Cargando...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty">
                    <div className="notif-empty-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="32" height="32">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                      </svg>
                    </div>
                    <span>Sin notificaciones</span>
                    <p>Cuando tengas nuevas notificaciones aparecerán aquí</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notif-item ${n.read ? "" : "unread"}`}
                    >
                      <div className="notif-avatar">
                        {getInitial(n.from?.name)}
                      </div>
                      <div className="notif-item-body">
                        <div className="notif-item-text">
                          {n.type === "share_invitation" ? (
                            <>
                              <strong>{n.from?.name || "Alguien"}</strong>{" "}
                              te invitó a{" "}
                              {n.document ? "la nota" : "la colección"}{" "}
                              <strong>{n.document?.title || n.collection?.name || "sin nombre"}</strong>
                            </>
                          ) : (
                            <>
                              <strong>{n.from?.name || "Alguien"}</strong>{" "}
                              aceptó tu invitación a{" "}
                              {n.document ? "la nota" : "la colección"}{" "}
                              <strong>{n.document?.title || n.collection?.name || "sin nombre"}</strong>
                            </>
                          )}
                        </div>
                        <div className="notif-item-meta">
                          <span className="notif-time">{formatTime(n.createdAt)}</span>
                          {n.type === "share_invitation" && n.status === "pending" && (
                            <div className="notif-actions">
                              <button
                                className="notif-btn accept"
                                onClick={(e) => { e.stopPropagation(); handleAccept(n._id); }}
                              >
                                Aceptar
                              </button>
                              <button
                                className="notif-btn reject"
                                onClick={(e) => { e.stopPropagation(); handleReject(n._id); }}
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                          {n.type === "share_invitation" && n.status === "accepted" && (
                            <span className="notif-status accepted">Aceptada</span>
                          )}
                          {n.type === "share_invitation" && n.status === "rejected" && (
                            <span className="notif-status rejected">Rechazada</span>
                          )}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          className="notif-read-btn"
                          onClick={(e) => { e.stopPropagation(); handleRead(n._id); }}
                          title="Marcar como leída"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="14" height="14">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

export default NotificationBell;
