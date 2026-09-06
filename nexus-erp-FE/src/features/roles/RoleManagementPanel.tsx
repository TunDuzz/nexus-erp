import { Check, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RoleDefinition, UserRole } from "../../types";

const roleLabels: Record<string, string> = {
  Admin: "Quản trị viên",
  Manager: "Quản lý",
  InventoryStaff: "Nhân viên kho",
  HrStaff: "Nhân sự",
};

const permissionLabels: Record<string, string> = {
  "hr.read": "Xem nhân sự",
  "hr.write": "Cập nhật nhân sự",
  "inventory.read": "Xem tồn kho",
  "inventory.write": "Cập nhật tồn kho",
  "identity.read": "Xem danh tính",
  "identity.roles.manage": "Quản lý vai trò",
};

export function RoleManagementPanel({
  roles,
  users,
  currentUserEmail,
  onRefresh,
  onUpdateUserRoles,
}: {
  roles: RoleDefinition[];
  users: UserRole[];
  currentUserEmail: string;
  onRefresh: () => Promise<void>;
  onUpdateUserRoles: (userId: string, roles: string[]) => Promise<void>;
}) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.userId ?? "");
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const selectedUser = users.find((user) => user.userId === selectedUserId) ?? users[0];

  useEffect(() => {
    if (!users.length) return;

    if (!selectedUserId || !users.some((user) => user.userId === selectedUserId)) {
      setSelectedUserId(users[0].userId);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!selectedUser) return;
    setDraftRoles(selectedUser.roles);
  }, [selectedUser?.userId, selectedUser?.roles]);

  const selectedRoleDefinitions = useMemo(
    () => roles.filter((role) => draftRoles.includes(role.name)),
    [draftRoles, roles],
  );
  const mergedPermissions = useMemo(
    () => [...new Set(selectedRoleDefinitions.flatMap((role) => role.permissions))].sort(),
    [selectedRoleDefinitions],
  );

  const toggleRole = (roleName: string) => {
    setDraftRoles((current) =>
      current.includes(roleName) ? current.filter((role) => role !== roleName) : [...current, roleName],
    );
  };

  const handleSave = async () => {
    if (!selectedUser || draftRoles.length === 0) return;

    setIsSaving(true);
    try {
      await onUpdateUserRoles(selectedUser.userId, draftRoles);
      await onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="content-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Người dùng</p>
            <h2>Phân quyền tài khoản</h2>
          </div>
          <Users aria-hidden="true" />
        </div>

        <div className="table-wrap" style={{ border: "none", boxShadow: "none", background: "transparent" }}>
          <table style={{ minWidth: "100%", width: "100%" }}>
            <thead>
              <tr>
                <th className="text-left" style={{ padding: "10px 12px" }}>Người dùng</th>
                <th className="text-left" style={{ padding: "10px 12px" }}>Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.userId}
                  onClick={() => setSelectedUserId(user.userId)}
                  style={{ cursor: "pointer", background: selectedUser?.userId === user.userId ? "color-mix(in srgb, var(--accent) 8%, transparent)" : undefined }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <strong>{user.fullName || user.email}</strong>
                    <span style={{ display: "block", color: "var(--muted)", fontSize: "0.76rem" }}>{user.email}</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div className="role-chip-list">
                      {user.roles.map((role) => (
                        <span className="status-badge success" key={role}>{roleLabels[role] ?? role}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Vai trò</p>
            <h2>{selectedUser ? selectedUser.fullName || selectedUser.email : "Chưa có người dùng"}</h2>
          </div>
          <ShieldCheck aria-hidden="true" />
        </div>

        {!selectedUser ? (
          <div className="empty-state">Chưa có tài khoản nào để phân quyền.</div>
        ) : (
          <div className="stack-form">
            <div className="form-section">
              <span className="form-section-title">Chọn role</span>
              <div className="role-option-grid">
                {roles.map((role) => {
                  const checked = draftRoles.includes(role.name);
                  const isSelfLastAdminRisk = selectedUser.email === currentUserEmail && role.name === "Admin" && checked;

                  return (
                    <button
                      className={checked ? "role-option active" : "role-option"}
                      key={role.name}
                      onClick={() => toggleRole(role.name)}
                      title={isSelfLastAdminRisk ? "Backend sẽ chặn nếu đây là Admin cuối cùng" : undefined}
                      type="button"
                    >
                      <span>{roleLabels[role.name] ?? role.name}</span>
                      {checked && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-section">
              <span className="form-section-title">Quyền nhận được</span>
              <div className="role-chip-list">
                {mergedPermissions.map((permission) => (
                  <span className="status-badge" key={permission}>{permissionLabels[permission] ?? permission}</span>
                ))}
              </div>
            </div>

            <div className="button-row">
              <button className={isSaving ? "primary-action loading" : "primary-action"} disabled={isSaving || draftRoles.length === 0} onClick={handleSave} type="button">
                {isSaving ? <span className="btn-spinner" /> : "Lưu phân quyền"}
              </button>
              <button className="secondary-action" onClick={() => setDraftRoles(selectedUser.roles)} type="button">
                Hoàn tác
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

