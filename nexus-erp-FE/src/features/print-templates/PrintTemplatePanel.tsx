import { useState } from "react";
import { Check, Copy, Eye, FileText, Plus, Printer, Star, Trash2, ArrowLeft, Building2 } from "lucide-react";
import { PrintTemplate, PrintTemplateType } from "../../types";

type PrintTemplatePanelProps = {
  templates: PrintTemplate[];
  onSaveTemplate: (template: PrintTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onSetDefaultTemplate: (id: string, type: PrintTemplateType) => void;
};

const sampleItems = [
  { stt: 1, sku: "SP-001", name: "Thép hộp mạ kẽm 50x50mm", unit: "Cây", quantity: 50, unitPrice: 185000, totalPrice: 9250000, note: "Hàng loại 1" },
  { stt: 2, sku: "SP-002", name: "Tấm thạch cao Gyproc 12mm", unit: "Tấm", quantity: 120, unitPrice: 145000, totalPrice: 17400000, note: "Nguyên tem" },
  { stt: 3, sku: "SP-003", name: "Sơn lót chống gỉ Epoxy 5L", unit: "Thùng", quantity: 15, unitPrice: 650000, totalPrice: 9750000, note: "Kiểm tra kỹ hạn dùng" },
];

export function PrintTemplatePanel({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onSetDefaultTemplate,
}: PrintTemplatePanelProps) {
  const [activeType, setActiveType] = useState<PrintTemplateType>("GOODS_RECEIPT");
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);

  const filteredTemplates = templates.filter((t) => t.type === activeType);

  const handleCreateNew = () => {
    const isReceipt = activeType === "GOODS_RECEIPT";
    const newTemplate: PrintTemplate = {
      id: `tpl-${Date.now()}`,
      name: isReceipt ? "Mẫu Phiếu Nhập Kho Mới" : "Mẫu Phiếu Xuất Kho Mới",
      type: activeType,
      isDefault: filteredTemplates.length === 0,
      pageSize: "A4",
      orientation: "portrait",
      showLogo: true,
      title: isReceipt ? "PHIẾU NHẬP KHO" : "PHIẾU XUẤT KHO",
      companyName: "Công ty Cổ phần Nexus ERP",
      address: "Số 123 Đường Khu Công Nghệ Cao, Q.9, TP. Hồ Chí Minh",
      phone: "028 3829 1122",
      email: "contact@nexus.local",
      columns: {
        stt: true,
        sku: true,
        name: true,
        unit: true,
        quantity: true,
        unitPrice: true,
        totalPrice: true,
        note: true,
      },
      signatures: isReceipt
        ? ["Người lập phiếu", "Người giao hàng", "Thủ kho", "Kế toán trưởng"]
        : ["Người lập phiếu", "Người nhận hàng", "Thủ kho", "Giám đốc"],
      footerNotes: isReceipt
        ? "Vui lòng kiểm tra kỹ số lượng và quy cách hàng hóa trước khi nhập kho."
        : "Hàng hóa xuất khỏi kho phải có đầy đủ chữ ký của thủ kho và người nhận.",
    };
    setEditingTemplate(newTemplate);
  };

  const handleDuplicate = (template: PrintTemplate) => {
    const duplicated: PrintTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Bản sao)`,
      isDefault: false,
    };
    onSaveTemplate(duplicated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    onSaveTemplate(editingTemplate);
    setEditingTemplate(null);
  };

  if (editingTemplate) {
    return (
      <div className="template-editor-shell">
        <div className="topbar">
          <div className="template-editor-title">
            <button
              className="secondary-action compact"
              onClick={() => setEditingTemplate(null)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" /> Quay lại danh sách
            </button>
            <h2>{editingTemplate.id.startsWith("tpl-") && !editingTemplate.name.includes("(Bản sao)") ? "Sửa mẫu in" : "Thiết lập mẫu in"}</h2>
          </div>
          <div className="button-row">
            <button className="secondary-action" onClick={() => setEditingTemplate(null)} type="button">
              Hủy
            </button>
            <button className="primary-action" onClick={handleSave} type="button">
              <Check aria-hidden="true" /> Lưu mẫu in
            </button>
          </div>
        </div>

        <div className="template-editor-grid">
          {/* Left Panel: Form Controls */}
          <form className="template-controls-panel" onSubmit={handleSave}>
            <div className="form-section">
              <div className="form-section-title">1. Thông tin mẫu & Thiết lập trang in mặc định</div>
              <label>
                Tên mẫu in
                <input
                  required
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Ví dụ: Phiếu xuất kho A4 Tiêu chuẩn"
                />
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editingTemplate.isDefault}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, isDefault: e.target.checked })}
                />
                <span>Đặt làm mẫu in mặc định cho {editingTemplate.type === "GOODS_RECEIPT" ? "Nhập kho" : "Xuất kho"}</span>
              </label>

              <div className="form-grid two-columns">
                <label>
                  Khổ giấy mặc định
                  <select
                    value={editingTemplate.pageSize}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, pageSize: e.target.value as "A4" | "A5" })
                    }
                  >
                    <option value="A4">Khổ A4 (Standard 210 x 297 mm)</option>
                    <option value="A5">Khổ A5 (Thu gọn 148 x 210 mm)</option>
                  </select>
                  <small style={{ color: "var(--muted)", fontSize: "0.74rem", fontWeight: 400 }}>Gợi ý khổ giấy khi xem trước</small>
                </label>
                <label>
                  Hướng in mặc định
                  <select
                    value={editingTemplate.orientation}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        orientation: e.target.value as "portrait" | "landscape",
                      })
                    }
                  >
                    <option value="portrait">In đứng (Portrait)</option>
                    <option value="landscape">In ngang (Landscape)</option>
                  </select>
                  <small style={{ color: "var(--muted)", fontSize: "0.74rem", fontWeight: 400 }}>Tự động chọn chiều xoay trang</small>
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Header & Thông tin doanh nghiệp</div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editingTemplate.showLogo}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, showLogo: e.target.checked })}
                />
                <span>Hiển thị Logo</span>
              </label>

              {editingTemplate.showLogo && (
                <label>
                  Đường dẫn Logo (URL hình ảnh)
                  <input
                    type="text"
                    value={editingTemplate.logoUrl || ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, logoUrl: e.target.value })}
                    placeholder="VD: https://domain.com/logo.png hoặc dán URL ảnh logo"
                  />
                  <small style={{ color: "var(--muted)", fontSize: "0.74rem", fontWeight: 400 }}>
                    Để trống nếu muốn dùng logo biểu tượng mặc định
                  </small>
                </label>
              )}

              <label>
                Tiêu đề phiếu
                <input
                  required
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  placeholder="PHIẾU NHẬP KHO"
                />
              </label>

              <label>
                Tên công ty / Chi nhánh
                <input
                  value={editingTemplate.companyName}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, companyName: e.target.value })}
                />
              </label>

              <label>
                Địa chỉ
                <input
                  value={editingTemplate.address}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, address: e.target.value })}
                />
              </label>

              <div className="form-grid two-columns">
                <label>
                  Số điện thoại
                  <input
                    value={editingTemplate.phone}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, phone: e.target.value })}
                  />
                </label>
                <label>
                  Email liên hệ
                  <input
                    value={editingTemplate.email ?? ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, email: e.target.value })}
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Bật/Tắt Cột trong Bảng hàng hóa</div>
              <div className="column-toggles-grid">
                {Object.entries({
                  stt: "Số thứ tự (STT)",
                  sku: "Mã sản phẩm (SKU)",
                  name: "Tên hàng hóa",
                  unit: "Đơn vị tính (ĐVT)",
                  quantity: "Số lượng",
                  unitPrice: "Đơn giá",
                  totalPrice: "Thành tiền",
                  note: "Ghi chú",
                }).map(([key, label]) => {
                  const colKey = key as keyof typeof editingTemplate.columns;
                  return (
                    <label key={key} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editingTemplate.columns[colKey]}
                        onChange={(e) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            columns: {
                              ...editingTemplate.columns,
                              [colKey]: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Chân trang & Chữ ký</div>
              <label>
                Danh sách Chữ ký (cách nhau bởi dấu phẩy)
                <input
                  value={editingTemplate.signatures.join(", ")}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      signatures: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Người lập phiếu, Thủ kho, Người nhận..."
                />
              </label>

              <label>
                Ghi chú cố định chân trang
                <textarea
                  rows={2}
                  value={editingTemplate.footerNotes}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, footerNotes: e.target.value })}
                  placeholder="Nhập ghi chú xuất hiện ở dưới cùng của phiếu..."
                />
              </label>
            </div>
          </form>

          {/* Right Panel: Real-time Live Preview Sheet */}
          <div className="template-preview-panel">
            <div className="preview-toolbar">
              <span>
                <Eye aria-hidden="true" /> Xem trước trực tiếp ({editingTemplate.pageSize} - {editingTemplate.orientation})
              </span>
            </div>

            <div className={`print-sheet-preview ${editingTemplate.pageSize.toLowerCase()} ${editingTemplate.orientation}`}>
              {/* Header */}
              <div className="sheet-header">
                <div className="company-info">
                  {editingTemplate.showLogo && (
                    <div className="sheet-logo-container">
                      {editingTemplate.logoUrl ? (
                        <img
                          src={editingTemplate.logoUrl}
                          alt="Logo"
                          className="sheet-logo-img"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="sheet-logo-badge" title="Logo công ty">
                          <Building2 aria-hidden="true" size={22} />
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <strong className="company-name">{editingTemplate.companyName || "TÊN CÔNG TY"}</strong>
                    <div className="company-meta">{editingTemplate.address}</div>
                    <div className="company-meta">SĐT: {editingTemplate.phone} {editingTemplate.email ? `| Email: ${editingTemplate.email}` : ""}</div>
                  </div>
                </div>
                <div className="sheet-voucher-id">
                  <div>Mẫu: {editingTemplate.pageSize}</div>
                  <div>Ngày: {new Date().toLocaleDateString("vi-VN")}</div>
                </div>
              </div>

              <h1 className="sheet-title">{editingTemplate.title || "PHIẾU CHỨNG TỪ"}</h1>

              {/* Meta information */}
              <div className="sheet-meta-grid">
                <div>
                  <strong>Số phiếu:</strong> {editingTemplate.type === "GOODS_RECEIPT" ? "NK-2026-0089" : "XK-2026-0102"}
                </div>
                <div>
                  <strong>{editingTemplate.type === "GOODS_RECEIPT" ? "Nhà cung cấp:" : "Khách hàng/Đơn vị nhận:"}</strong> Công ty TNHH Vật Tư Xây Dựng Số 1
                </div>
                <div>
                  <strong>Kho thực hiện:</strong> Kho Trung Tâm Hồ Chí Minh
                </div>
                <div>
                  <strong>Diễn giải / Lý do:</strong> {editingTemplate.type === "GOODS_RECEIPT" ? "Nhập kho mua mới đợt 1" : "Xuất hàng cung ứng công trình Q2"}
                </div>
              </div>

              {/* Table */}
              <table className="sheet-table">
                <thead>
                  <tr>
                    {editingTemplate.columns.stt && <th style={{ width: "35px", textAlign: "center" }}>STT</th>}
                    {editingTemplate.columns.sku && <th style={{ width: "80px", whiteSpace: "nowrap" }}>Mã SKU</th>}
                    {editingTemplate.columns.name && <th>Tên sản phẩm</th>}
                    {editingTemplate.columns.unit && <th style={{ width: "45px", textAlign: "center", whiteSpace: "nowrap" }}>ĐVT</th>}
                    {editingTemplate.columns.quantity && <th className="text-right" style={{ width: "45px", whiteSpace: "nowrap" }}>SL</th>}
                    {editingTemplate.columns.unitPrice && <th className="text-right" style={{ width: "80px", whiteSpace: "nowrap" }}>Đơn giá</th>}
                    {editingTemplate.columns.totalPrice && <th className="text-right" style={{ width: "90px", whiteSpace: "nowrap" }}>Thành tiền</th>}
                    {editingTemplate.columns.note && <th>Ghi chú</th>}
                  </tr>
                </thead>
                <tbody>
                  {sampleItems.map((item) => (
                    <tr key={item.stt}>
                      {editingTemplate.columns.stt && <td style={{ textAlign: "center" }}>{item.stt}</td>}
                      {editingTemplate.columns.sku && <td className="font-mono col-nowrap">{item.sku}</td>}
                      {editingTemplate.columns.name && <td>{item.name}</td>}
                      {editingTemplate.columns.unit && <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>{item.unit}</td>}
                      {editingTemplate.columns.quantity && <td className="text-right col-nowrap">{item.quantity}</td>}
                      {editingTemplate.columns.unitPrice && (
                        <td className="text-right col-nowrap">{item.unitPrice.toLocaleString("vi-VN")} ₫</td>
                      )}
                      {editingTemplate.columns.totalPrice && (
                        <td className="text-right col-nowrap">{item.totalPrice.toLocaleString("vi-VN")} ₫</td>
                      )}
                      {editingTemplate.columns.note && <td>{item.note}</td>}
                    </tr>
                  ))}
                </tbody>
                {editingTemplate.columns.totalPrice && (
                  <tfoot>
                    <tr>
                      <td colSpan={(Object.values(editingTemplate.columns).filter(Boolean).length) - 1} className="text-right font-bold">
                        Tổng cộng:
                      </td>
                      <td className="text-right font-bold">36.400.000 ₫</td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {/* Footer Notes */}
              {editingTemplate.footerNotes && (
                <div className="sheet-footer-notes">
                  <strong>Ghi chú:</strong> {editingTemplate.footerNotes}
                </div>
              )}

              {/* Signatures */}
              {editingTemplate.signatures.length > 0 && (
                <div className="sheet-signatures-grid" style={{ gridTemplateColumns: `repeat(${editingTemplate.signatures.length}, 1fr)` }}>
                  {editingTemplate.signatures.map((sig, idx) => (
                    <div key={idx} className="signature-box">
                      <strong>{sig}</strong>
                      <span>(Ký, ghi rõ họ tên)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel full-width">
      <div className="panel-heading">
        <div>
          <h2>Quản lý Cấu hình Mẫu in</h2>
          <p className="subtitle">Thiết lập biểu mẫu in cho Phiếu Nhập Kho và Phiếu Xuất Kho</p>
        </div>
        <button className="primary-action" onClick={handleCreateNew} type="button">
          <Plus aria-hidden="true" /> Tạo mẫu in mới
        </button>
      </div>

      {/* Type Switcher Tabs */}
      <div className="segmented-control" style={{ maxWidth: "360px", marginBottom: "20px" }}>
        <button
          className={activeType === "GOODS_RECEIPT" ? "selected" : ""}
          onClick={() => setActiveType("GOODS_RECEIPT")}
          type="button"
        >
          Phiếu Nhập Kho ({templates.filter((t) => t.type === "GOODS_RECEIPT").length})
        </button>
        <button
          className={activeType === "GOODS_ISSUE" ? "selected" : ""}
          onClick={() => setActiveType("GOODS_ISSUE")}
          type="button"
        >
          Phiếu Xuất Kho ({templates.filter((t) => t.type === "GOODS_ISSUE").length})
        </button>
      </div>

      {/* Templates List */}
      <div className="template-cards-grid">
        {filteredTemplates.map((template) => (
          <div key={template.id} className={`template-card ${template.isDefault ? "is-default" : ""}`}>
            <div className="template-card-header">
              <div className="template-card-icon">
                <FileText aria-hidden="true" />
              </div>
              <div>
                <h3>{template.name}</h3>
                <span className="template-badge">
                  {template.pageSize} - {template.orientation === "portrait" ? "Khổ đứng" : "Khổ ngang"}
                </span>
              </div>
              {template.isDefault && (
                <span className="default-badge" title="Mẫu in mặc định khi thực hiện in">
                  <Star aria-hidden="true" /> Mặc định
                </span>
              )}
            </div>

            <div className="template-card-body">
              <div className="template-detail-line">
                <span>Trang in mặc định:</span> <strong>Khổ {template.pageSize} · Hướng {template.orientation === "portrait" ? "Đứng" : "Ngang"}</strong>
              </div>
              <div className="template-detail-line">
                <span>Tiêu đề phiếu:</span> <strong>{template.title}</strong>
              </div>
              <div className="template-detail-line">
                <span>Hiển thị đơn giá:</span>{" "}
                <strong>{template.columns.unitPrice ? "Có" : "Không (Ẩn giá)"}</strong>
              </div>
              <div className="template-detail-line">
                <span>Chữ ký chân trang:</span> <strong>{template.signatures.length} vị trí</strong>
              </div>
            </div>

            <div className="template-card-footer">
              {!template.isDefault && (
                <button
                  className="secondary-action compact"
                  onClick={() => onSetDefaultTemplate(template.id, template.type)}
                  type="button"
                >
                  <Star aria-hidden="true" /> Đặt mặc định
                </button>
              )}
              <button className="secondary-action compact" onClick={() => setEditingTemplate(template)} type="button">
                Sửa mẫu
              </button>
              <button className="secondary-action compact" onClick={() => handleDuplicate(template)} type="button" title="Nhân bản mẫu in">
                <Copy aria-hidden="true" />
              </button>
              {!template.isDefault && (
                <button
                  className="danger-action compact"
                  onClick={() => onDeleteTemplate(template.id)}
                  type="button"
                  title="Xóa mẫu in"
                >
                  <Trash2 aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
