import { Bell, LogOut, Moon, Sun, Trash2, Warehouse, X } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { viewItems } from "../constants/navigation";
import { AppNotification, Theme, UserSession, View } from "../types";

export function AppLayout({
  activeView,
  children,
  lowStockCount,
  onLogout,
  onThemeToggle,
  onViewChange,
  theme,
  user,
  notifications = [],
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
}: {
  activeView: View;
  apiBaseUrl: string;
  children: ReactNode;
  lowStockCount: number;
  onLogout: () => void;
  onThemeToggle: () => void;
  onViewChange: (view: View) => void;
  theme: Theme;
  user: UserSession;
  notifications?: AppNotification[];
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const availableViews = useMemo(
    () => viewItems.filter((item) => !item.requiredPermission || user.permissions.includes(item.requiredPermission)),
    [user.permissions],
  );
  const pageTitle = availableViews.find((item) => item.id === activeView)?.label ?? "Tổng quan";
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const userRoles = user.roles ?? [];
  const roleLabel = userRoles.includes("Admin")
    ? "Quản trị viên"
    : userRoles.includes("Manager")
      ? "Quản lý"
      : userRoles.includes("HrStaff")
        ? "Nhân sự"
        : "Thủ kho";

  return (
    <div className={`app-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`} aria-label="Điều hướng chính">
        <button
          className="brand-mark-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          type="button"
        >
          <Warehouse aria-hidden="true" />
          {!isCollapsed && (
            <div className="brand-text">
              <strong>Nexus ERP</strong>
              <span>Trung tâm quản lý kho</span>
            </div>
          )}
        </button>

        <nav className="main-nav">
          {availableViews.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={activeView === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => onViewChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                type="button"
              >
                <Icon aria-hidden="true" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="operator-card" style={{ justifyContent: isCollapsed ? "center" : "space-between" }}>
            {isCollapsed ? (
              <button
                className="icon-button"
                onClick={onLogout}
                style={{
                  border: 0,
                  background: "transparent",
                  boxShadow: "none",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--sidebar-text)",
                  padding: 0,
                  minHeight: "auto",
                }}
                title={`Đăng xuất (${user.fullName})`}
                type="button"
              >
                <LogOut size={18} />
              </button>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span className="avatar">
                    {user.fullName.slice(0, 1).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", color: "var(--sidebar-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.fullName}
                    </strong>
                    <span style={{ color: "var(--sidebar-muted)", fontSize: "0.72rem" }}>{roleLabel}</span>
                  </div>
                </div>

                <button className="icon-button" onClick={onLogout} title="Đăng xuất" type="button">
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Quản lý kho</p>
            <h1>{pageTitle}</h1>
          </div>

          <div className="toolbar" aria-label="Thanh công cụ">
            <div style={{ position: "relative" }}>
              <button
                aria-label="Thông báo tồn kho"
                className="icon-button"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Thông báo hệ thống"
                type="button"
              >
                <Bell aria-hidden="true" />
                {unreadCount > 0 && <span className="notification-dot" />}
              </button>

              {showNotifications && (
                <div className="notification-panel">
                  <header className="notification-header">
                    <strong>Thông báo ({unreadCount})</strong>
                    <div className="button-row">
                      {unreadCount > 0 && onMarkAllAsRead && (
                        <button className="secondary-action compact" onClick={onMarkAllAsRead} type="button">
                          Đọc tất cả
                        </button>
                      )}
                      <button className="icon-button" onClick={() => setShowNotifications(false)} type="button">
                        <X size={16} />
                      </button>
                    </div>
                  </header>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="empty-state">Không có thông báo nào.</div>
                    ) : (
                      notifications.map((notification) => (
                        <article className={notification.read ? "notification-item" : "notification-item unread"} key={notification.id}>
                          <div>
                            <strong>{notification.title}</strong>
                            <p>{notification.message}</p>
                            <span>{new Date(notification.createdAt).toLocaleString("vi-VN")}</span>
                          </div>
                          {onDeleteNotification && (
                            <button
                              className="icon-button"
                              onClick={() => onDeleteNotification(notification.id)}
                              title="Xóa thông báo"
                              type="button"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </article>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && onClearAllNotifications && (
                    <footer className="notification-footer">
                      <button className="danger-action compact" onClick={onClearAllNotifications} type="button">
                        Xóa tất cả thông báo
                      </button>
                    </footer>
                  )}
                </div>
              )}
            </div>

            <button
              aria-label="Đổi giao diện sáng tối"
              className="icon-button"
              onClick={onThemeToggle}
              title="Đổi giao diện sáng tối"
              type="button"
            >
              {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
            </button>
          </div>
        </header>

        {lowStockCount > 0 && <span className="sr-only">Có {lowStockCount} nguyên liệu sắp hết hàng</span>}
        {children}
      </main>
    </div>
  );
}


