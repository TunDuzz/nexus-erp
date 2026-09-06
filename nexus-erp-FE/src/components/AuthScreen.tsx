import { Moon, ShieldCheck, Sun, UserPlus, Warehouse } from "lucide-react";
import { FormEvent, useState } from "react";
import { AuthMode, AuthPayload, Theme } from "../types";

export function AuthScreen({
  authMode,
  onAuth,
  onModeChange,
  onThemeToggle,
  theme,
}: {
  authMode: AuthMode;
  onAuth: (payload: AuthPayload) => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
  onThemeToggle: () => void;
  theme: Theme;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);

    try {
      await onAuth({ mode: authMode, email, password, firstName, lastName });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <button
        aria-label="Đổi giao diện sáng tối"
        className="theme-floating icon-button"
        disabled={isSubmitting}
        onClick={onThemeToggle}
        title="Đổi giao diện sáng tối"
        type="button"
      >
        {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      </button>

      <section className="auth-panel" aria-label="Đăng nhập Nexus ERP">
        <div className="auth-brand">
          <Warehouse aria-hidden="true" />
          <h2>Nexus ERP</h2>
          <p>Hệ thống quản lý kho gọn gàng & chuyên nghiệp</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="segmented-control" role="tablist" aria-label="Chế độ xác thực">
            <button
              aria-selected={authMode === "login"}
              className={authMode === "login" ? "selected" : ""}
              disabled={isSubmitting}
              onClick={() => onModeChange("login")}
              role="tab"
              type="button"
            >
              Đăng nhập
            </button>
            <button
              aria-selected={authMode === "register"}
              className={authMode === "register" ? "selected" : ""}
              disabled={isSubmitting}
              onClick={() => onModeChange("register")}
              role="tab"
              type="button"
            >
              Đăng ký
            </button>
          </div>

          {authMode === "register" && (
            <div className="form-grid two-columns">
              <label>
                Họ
                <input disabled={isSubmitting} name="firstName" placeholder="Trần" required />
              </label>
              <label>
                Tên
                <input disabled={isSubmitting} name="lastName" placeholder="Anh" required />
              </label>
            </div>
          )}

          <label>
            Địa chỉ Email
            <input
              autoComplete="email"
              disabled={isSubmitting}
              name="email"
              placeholder="admin@nexus.local"
              required
              type="email"
            />
          </label>
          <label>
            Mật khẩu
            <input
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              disabled={isSubmitting}
              minLength={6}
              name="password"
              placeholder="Nhập mật khẩu"
              required
              type="password"
            />
          </label>

          <button className={`primary-action ${isSubmitting ? "loading" : ""}`} disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <span className="btn-spinner" />
            ) : authMode === "login" ? (
              <ShieldCheck aria-hidden="true" />
            ) : (
              <UserPlus aria-hidden="true" />
            )}
            {authMode === "login" ? "Đăng nhập hệ thống" : "Tạo tài khoản mới"}
          </button>
        </form>
      </section>
    </main>
  );
}
