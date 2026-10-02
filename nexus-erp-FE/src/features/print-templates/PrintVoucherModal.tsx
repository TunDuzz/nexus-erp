import { useState, useMemo } from "react";
import { Printer, X, Check, Building2 } from "lucide-react";
import { Movement, PrintTemplate, PrintTemplateType, Product } from "../../types";
import { formatCurrency } from "../../utils/formatters";

type VoucherItemLine = {
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
};

const getDocumentId = (m: Movement) => m.documentId ?? m.id.split(":")[0];

type PrintVoucherModalProps = {
  movement: Movement;
  movements?: Movement[];
  products: Product[];
  availableTemplates: PrintTemplate[];
  onClose: () => void;
};

export function PrintVoucherModal({
  movement,
  movements = [],
  products,
  availableTemplates,
  onClose,
}: PrintVoucherModalProps) {
  const voucherType: PrintTemplateType = movement.type === "receipt" ? "GOODS_RECEIPT" : "GOODS_ISSUE";

  const matchingTemplates = useMemo(
    () => availableTemplates.filter((t) => t.type === voucherType),
    [availableTemplates, voucherType]
  );

  const defaultTemplate = useMemo(
    () => matchingTemplates.find((t) => t.isDefault) || matchingTemplates[0],
    [matchingTemplates]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    defaultTemplate?.id || ""
  );

  const activeTemplate = useMemo(
    () => matchingTemplates.find((t) => t.id === selectedTemplateId) || defaultTemplate,
    [matchingTemplates, selectedTemplateId, defaultTemplate]
  );

  // Group all movements belonging to this document
  const documentMovements = useMemo(() => {
    if (!movements || movements.length === 0) return [movement];
    const targetDocId = getDocumentId(movement);
    const matched = movements.filter(
      (m) =>
        m.type === movement.type &&
        (m.number === movement.number || getDocumentId(m) === targetDocId)
    );
    return matched.length > 0 ? matched : [movement];
  }, [movement, movements]);

  // Map all document movement lines to voucher items
  const items: VoucherItemLine[] = useMemo(() => {
    return documentMovements.map((m) => {
      const p = products.find((prod) => prod.sku === m.sku);
      const unitPrice = m.quantity > 0 ? m.value / m.quantity : p ? p.unitPrice : 0;
      return {
        sku: m.sku,
        name: p ? p.name : m.sku,
        unit: p ? p.unitOfMeasure : "Cái",
        quantity: m.quantity,
        unitPrice: unitPrice,
        totalPrice: m.value,
        note: (m as any).itemNote || (m as any).lineNote || (m as any).productNote || "",
      };
    });
  }, [documentMovements, products]);

  const totalDocumentValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const handleTriggerPrint = () => {
    window.print();
  };

  if (!activeTemplate) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3>In chứng từ</h3>
            <button className="modal-close-btn" onClick={onClose} type="button">
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="modal-body">
            <p>Chưa có mẫu in nào phù hợp cho loại phiếu này. Vui lòng vào mục "Mẫu in" để tạo mẫu.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay print-modal-overlay">
      <div className="modal-container print-modal-container">
        {/* Header toolbar (screen only) */}
        <div className="modal-header print-modal-header no-print">
          <div className="print-template-selector">
            <label htmlFor="template-select" className="sr-only">Chọn mẫu in</label>
            <span>Mẫu in:</span>
            <select
              id="template-select"
              value={activeTemplate.id}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              {matchingTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isDefault ? "(Mặc định)" : ""} [{t.pageSize}]
                </option>
              ))}
            </select>
          </div>

          <div className="button-row">
            <button className="secondary-action compact" onClick={onClose} type="button">
              Đóng
            </button>
            <button className="primary-action compact" onClick={handleTriggerPrint} type="button">
              <Printer aria-hidden="true" /> In ngay (Ctrl + P)
            </button>
          </div>
        </div>

        {/* Printable Sheet View */}
        <div className="modal-body print-modal-body">
          <div
            id="printable-voucher-area"
            className={`printable-sheet ${activeTemplate.pageSize.toLowerCase()} ${activeTemplate.orientation}`}
          >
            {/* Header */}
            <div className="sheet-header">
              <div className="company-info">
                {activeTemplate.showLogo && (
                  <div className="sheet-logo-container">
                    {activeTemplate.logoUrl ? (
                      <img
                        src={activeTemplate.logoUrl}
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
                  <strong className="company-name">{activeTemplate.companyName}</strong>
                  <div className="company-meta">{activeTemplate.address}</div>
                  <div className="company-meta">
                    SĐT: {activeTemplate.phone} {activeTemplate.email ? `| Email: ${activeTemplate.email}` : ""}
                  </div>
                </div>
              </div>
              <div className="sheet-voucher-id">
                <div>Khổ: {activeTemplate.pageSize}</div>
                <div>Ngày: {new Date(movement.createdAt).toLocaleDateString("vi-VN")}</div>
              </div>
            </div>

            <h1 className="sheet-title">{activeTemplate.title}</h1>

            {/* Meta Information */}
            <div className="sheet-meta-grid">
              <div>
                <strong>Số chứng từ:</strong> {movement.number}
              </div>
              <div>
                <strong>{movement.type === "receipt" ? "Nhà cung cấp / Đối tác:" : "Khách hàng / Đơn vị nhận:"}</strong>{" "}
                {movement.contact || "Đối tác ngoài"}
              </div>
              <div>
                <strong>Kho thực hiện:</strong> Kho Trung Tâm
              </div>
              <div>
                <strong>Người thực hiện:</strong> {movement.creator || "Admin"}
              </div>
              {movement.note && (
                <div className="full-width-meta">
                  <strong>Ghi chú chứng từ:</strong> {movement.note}
                </div>
              )}
            </div>

            {/* Table */}
            <table className="sheet-table">
              <thead>
                <tr>
                  {activeTemplate.columns.stt && <th style={{ width: "35px", textAlign: "center" }}>STT</th>}
                  {activeTemplate.columns.sku && <th style={{ width: "80px", whiteSpace: "nowrap" }}>Mã SKU</th>}
                  {activeTemplate.columns.name && <th>Tên hàng hóa</th>}
                  {activeTemplate.columns.unit && <th style={{ width: "45px", textAlign: "center", whiteSpace: "nowrap" }}>ĐVT</th>}
                  {activeTemplate.columns.quantity && <th className="text-right" style={{ width: "45px", whiteSpace: "nowrap" }}>SL</th>}
                  {activeTemplate.columns.unitPrice && <th className="text-right" style={{ width: "80px", whiteSpace: "nowrap" }}>Đơn giá</th>}
                  {activeTemplate.columns.totalPrice && <th className="text-right" style={{ width: "90px", whiteSpace: "nowrap" }}>Thành tiền</th>}
                  {activeTemplate.columns.note && <th>Ghi chú</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    {activeTemplate.columns.stt && <td style={{ textAlign: "center" }}>{idx + 1}</td>}
                    {activeTemplate.columns.sku && <td className="font-mono col-nowrap">{item.sku}</td>}
                    {activeTemplate.columns.name && <td>{item.name}</td>}
                    {activeTemplate.columns.unit && <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>{item.unit}</td>}
                    {activeTemplate.columns.quantity && <td className="text-right col-nowrap">{item.quantity}</td>}
                    {activeTemplate.columns.unitPrice && (
                      <td className="text-right col-nowrap">{formatCurrency(item.unitPrice)}</td>
                    )}
                    {activeTemplate.columns.totalPrice && (
                      <td className="text-right col-nowrap">{formatCurrency(item.totalPrice)}</td>
                    )}
                    {activeTemplate.columns.note && <td>{item.note && item.note !== "-" ? item.note : ""}</td>}
                  </tr>
                ))}
              </tbody>
              {activeTemplate.columns.totalPrice && (
                <tfoot>
                  <tr>
                    <td
                      colSpan={Object.values(activeTemplate.columns).filter(Boolean).length - 1}
                      className="text-right font-bold"
                    >
                      Tổng cộng tiền:
                    </td>
                    <td className="text-right font-bold">{formatCurrency(totalDocumentValue)}</td>
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Footer Notes */}
            {activeTemplate.footerNotes && (
              <div className="sheet-footer-notes">
                <strong>Ghi chú:</strong> {activeTemplate.footerNotes}
              </div>
            )}

            {/* Signatures */}
            {activeTemplate.signatures.length > 0 && (
              <div
                className="sheet-signatures-grid"
                style={{ gridTemplateColumns: `repeat(${activeTemplate.signatures.length}, 1fr)` }}
              >
                {activeTemplate.signatures.map((sig, idx) => (
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
