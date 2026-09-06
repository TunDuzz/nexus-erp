import { ArrowDownToLine, ArrowUpFromLine, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Movement, Product, StockMovementDraft } from "../types";
import { dateFormatter, formatCurrency } from "../utils/formatters";
import { EmptyState } from "./EmptyState";

type EditLine = {
  id: string;
  sku: string;
  quantity: string;
  unitValue: string;
};

const toMoneyInput = (value: number) => Number(value || 0).toLocaleString("en-US");
const parseMoneyInput = (value: string) => Number(value.replace(/\D/g, ""));
const getDocumentId = (movement: Movement) => movement.documentId ?? movement.id.split(":")[0];
const createLineId = () => `edit-line-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

export function MovementList({
  movements,
  products,
  onUpdateMovement,
  onDeleteMovement,
}: {
  movements: Movement[];
  products?: Product[];
  onUpdateMovement?: (movement: StockMovementDraft) => void | Promise<void>;
  onDeleteMovement?: (movement: Movement) => void | Promise<void>;
}) {
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editNumber, setEditNumber] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editLines, setEditLines] = useState<EditLine[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;
  const productOptions = products ?? [];

  const documentGroups = useMemo(() => {
    const groups = new Map<string, Movement[]>();
    for (const movement of movements) {
      const key = `${movement.type}::${getDocumentId(movement)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(movement);
    }
    return Array.from(groups.values());
  }, [movements]);

  const totalPages = Math.ceil(documentGroups.length / itemsPerPage) || 1;

  const selectedDocumentMovements = useMemo(() => {
    if (!selectedMovement) return [];

    const documentId = getDocumentId(selectedMovement);
    const sameDocument = movements.filter(
      (movement) => movement.type === selectedMovement.type && getDocumentId(movement) === documentId,
    );

    return sameDocument.length > 0 ? sameDocument : [selectedMovement];
  }, [movements, selectedMovement]);

  const documentTotalValue = selectedDocumentMovements.reduce((total, movement) => total + movement.value, 0);
  const documentTotalQuantity = selectedDocumentMovements.reduce((total, movement) => total + movement.quantity, 0);
  const editTotalValue = editLines.reduce(
    (total, line) => total + Number(line.quantity || 0) * parseMoneyInput(line.unitValue),
    0,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [movements.length]);

  if (movements.length === 0) {
    return (
      <EmptyState
        title="Chưa có phiếu kho"
        detail="Phiếu nhập/xuất sẽ xuất hiện sau khi bạn xác nhận giao dịch."
      />
    );
  }

  const getProduct = (sku: string) => productOptions.find((product) => product.sku === sku);
  const getProductName = (sku: string) => getProduct(sku)?.name ?? "Sản phẩm không xác định";

  const getDocumentMovements = (movement: Movement) => {
    const documentId = getDocumentId(movement);
    const sameDocument = movements.filter((item) => item.type === movement.type && getDocumentId(item) === documentId);

    return sameDocument.length > 0 ? sameDocument : [movement];
  };

  const createEditLine = (sku?: string): EditLine => {
    const usedSkus = new Set(editLines.map((line) => line.sku).filter(Boolean));
    const product = productOptions.find((item) => item.sku === sku) ?? productOptions.find((item) => !usedSkus.has(item.sku));

    return {
      id: createLineId(),
      sku: product?.sku ?? "",
      quantity: "1",
      unitValue: product ? toMoneyInput(product.unitPrice) : "",
    };
  };

  const startEditing = (movement: Movement) => {
    const documentMovements = getDocumentMovements(movement);

    setEditNumber(movement.number);
    setEditContact(movement.contact);
    setEditNote(movement.note);
    setEditLines(
      documentMovements.map((item) => ({
        id: item.lineId ?? item.id,
        sku: item.sku,
        quantity: String(item.quantity),
        unitValue: toMoneyInput(item.quantity > 0 ? item.value / item.quantity : getProduct(item.sku)?.unitPrice ?? 0),
      })),
    );
    setIsEditing(true);
  };

  const updateEditLine = (lineId: string, patch: Partial<EditLine>) => {
    setEditLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  };

  const handleSkuChange = (lineId: string, sku: string) => {
    const product = getProduct(sku);
    updateEditLine(lineId, {
      sku,
      unitValue: product ? toMoneyInput(product.unitPrice) : "",
    });
  };

  const handleAddLine = () => {
    setEditLines((current) => [...current, createEditLine()]);
  };

  const handleRemoveLine = (lineId: string) => {
    setEditLines((current) => (current.length === 1 ? current : current.filter((line) => line.id !== lineId)));
  };

  const handleSave = async () => {
    if (!selectedMovement || !onUpdateMovement || isSaving) return;

    const parsedLines = editLines.map((line) => ({
      id: line.id,
      sku: line.sku.trim(),
      quantity: Number(line.quantity),
      unitValue: parseMoneyInput(line.unitValue),
    }));

    if (!editNumber.trim() || !editContact.trim() || parsedLines.length === 0) {
      window.alert("Vui lòng nhập đầy đủ thông tin phiếu.");
      return;
    }

    if (parsedLines.some((line) => !line.sku || !Number.isFinite(line.quantity) || line.quantity <= 0 || line.unitValue <= 0)) {
      window.alert("Mỗi dòng nguyên liệu cần có SKU, số lượng và đơn giá hợp lệ.");
      return;
    }

    const duplicateSku = parsedLines.find((line, index) => parsedLines.findIndex((item) => item.sku === line.sku) !== index)?.sku;
    if (duplicateSku) {
      window.alert(`Nguyên liệu ${duplicateSku} đang bị chọn trùng trong cùng một phiếu.`);
      return;
    }

    if (selectedMovement.type === "issue" && productOptions.length > 0) {
      for (const line of parsedLines) {
        const product = getProduct(line.sku);
        const oldQuantityInDocument = selectedDocumentMovements
          .filter((movement) => movement.sku === line.sku)
          .reduce((total, movement) => total + movement.quantity, 0);
        const maxAvailable = (product?.quantityOnHand ?? 0) + oldQuantityInDocument;

        if (line.quantity > maxAvailable) {
          window.alert(`Số lượng xuất của ${line.sku} (${line.quantity}) vượt quá tồn kho khả dụng (${maxAvailable}).`);
          return;
        }
      }
    }

    const draft: StockMovementDraft = {
      id: getDocumentId(selectedMovement),
      type: selectedMovement.type,
      number: editNumber.trim(),
      contact: editContact.trim(),
      note: editNote.trim(),
      createdAt: selectedMovement.createdAt,
      creator: selectedMovement.creator,
      lines: parsedLines,
    };

    try {
      setIsSaving(true);
      await onUpdateMovement(draft);
      setSelectedMovement(null);
      setIsEditing(false);
    } catch {
      // App.tsx already shows the backend error as a toast; keep the modal open for correction.
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMovement || !onDeleteMovement) return;

    const typeText = selectedMovement.type === "receipt" ? "nhập kho" : "xuất kho";
    const confirmMsg = `Bạn có chắc chắn muốn xóa phiếu ${typeText} ${selectedMovement.number}?\nPhiếu này có ${selectedDocumentMovements.length} dòng, tổng số lượng ${documentTotalQuantity}.`;

    if (window.confirm(confirmMsg)) {
      await onDeleteMovement(selectedMovement);
      setSelectedMovement(null);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGroups = documentGroups.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <div className="movement-list">
        {paginatedGroups.map((group) => {
          const first = group[0];
          const totalValue = group.reduce((sum, m) => sum + m.value, 0);
          const skuList = group
            .map((m) => `${m.sku} · ${m.quantity} ${getProduct(m.sku)?.unitOfMeasure ?? "đv"}`)
            .join(" | ");

          return (
            <article
              className="movement-item"
              key={first.id}
              onClick={() => {
                setSelectedMovement(first);
                setIsEditing(false);
              }}
              style={{ cursor: "pointer" }}
              title="Nhấp để xem chi tiết phiếu"
            >
              <div className={`movement-icon ${first.type}`}>
                {first.type === "receipt" ? <ArrowDownToLine aria-hidden="true" /> : <ArrowUpFromLine aria-hidden="true" />}
              </div>
              <div>
                <strong>{first.number}</strong>
                <span>{first.contact} · {skuList}</span>
              </div>
              <div className="movement-value">
                <strong>{formatCurrency(totalValue)}</strong>
                <span>{dateFormatter.format(new Date(first.createdAt))}</span>
              </div>
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--surface)", fontSize: "0.82rem", marginTop: "12px" }}>
          <span style={{ color: "var(--muted)" }}>Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, documentGroups.length)} trên {documentGroups.length} phiếu</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ padding: "4px 10px", minHeight: "30px", fontSize: "0.78rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", opacity: currentPage === 1 ? 0.5 : 1 }} type="button">
              Trước
            </button>
            <span style={{ fontWeight: 600 }}>Trang {currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ padding: "4px 10px", minHeight: "30px", fontSize: "0.78rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }} type="button">
              Sau
            </button>
          </div>
        </div>
      )}

      {selectedMovement && (
        <div className="modal-overlay" onClick={() => setSelectedMovement(null)}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <h3>{isEditing ? "Chỉnh sửa phiếu kho" : "Chi tiết phiếu kho"}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedMovement(null)} title="Đóng hộp thoại" type="button">
                <X size={16} />
              </button>
            </header>

            <div className="modal-body">
              <div className="voucher-details-grid">
                <div className="voucher-detail-item">
                  <label>Loại phiếu</label>
                  <span>
                    <span className={`status-badge ${selectedMovement.type === "receipt" ? "success" : "warning"}`} style={{ display: "inline-flex" }}>
                      {selectedMovement.type === "receipt" ? "Nhập kho" : "Xuất kho"}
                    </span>
                  </span>
                </div>
                <div className="voucher-detail-item">
                  <label>Số chứng từ</label>
                  {isEditing ? (
                    <input style={{ minHeight: "34px", padding: "0 8px", fontSize: "0.88rem" }} value={editNumber} onChange={(event) => setEditNumber(event.target.value)} required />
                  ) : (
                    <span style={{ fontFamily: "monospace", fontSize: "1rem", color: "var(--accent-strong)" }}>{selectedMovement.number}</span>
                  )}
                </div>
                <div className="voucher-detail-item">
                  <label>{selectedMovement.type === "receipt" ? "Nhà cung cấp" : "Đối tác giao nhận"}</label>
                  {isEditing ? (
                    <input style={{ minHeight: "34px", padding: "0 8px", fontSize: "0.88rem" }} value={editContact} onChange={(event) => setEditContact(event.target.value)} required />
                  ) : (
                    <span>{selectedMovement.contact}</span>
                  )}
                </div>
                <div className="voucher-detail-item">
                  <label>Thời gian tạo</label>
                  <span>{dateFormatter.format(new Date(selectedMovement.createdAt))}</span>
                </div>
                <div className="voucher-detail-item">
                  <label>Người lập phiếu</label>
                  <span>{selectedMovement.creator ?? "Hệ thống"}</span>
                </div>
                <div className="voucher-detail-item">
                  <label>Tổng phiếu</label>
                  <span>{formatCurrency(isEditing ? editTotalValue : documentTotalValue)}</span>
                </div>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontSize: "0.76rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>
                    Danh sách nguyên liệu
                  </label>
                  {isEditing && (
                    <button className="secondary-action" onClick={handleAddLine} type="button" style={{ minHeight: "32px", padding: "0 10px", fontSize: "0.78rem" }}>
                      <Plus size={15} /> Thêm nguyên liệu
                    </button>
                  )}
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  {isEditing
                    ? editLines.map((line, index) => {
                        const quantity = Number(line.quantity || 0);
                        const unitValue = parseMoneyInput(line.unitValue);
                        const product = getProduct(line.sku);
                        const isLowStock = product ? product.quantityOnHand <= product.reorderLevel : false;

                        return (
                          <div
                            key={line.id}
                            className={`context-card ${!isLowStock ? "" : "low-stock"}`}
                            style={{ display: "grid", gridTemplateColumns: "2.2fr 0.8fr 1.2fr auto", gap: "10px", alignItems: "stretch" }}
                          >
                            <label>
                              Nguyên liệu #{index + 1}
                              <select value={line.sku} onChange={(event) => handleSkuChange(line.id, event.target.value)} style={{ minHeight: "34px", width: "100%" }}>
                                <option value="">Chọn nguyên liệu</option>
                                {productOptions.map((product) => (
                                  <option key={product.sku} value={product.sku}>
                                    {product.sku} - {product.name}
                                  </option>
                                ))}
                              </select>
                              {product && (
                                <span style={{ color: "var(--muted)", display: "block", fontSize: "0.74rem", marginTop: "4px" }}>
                                  Tồn: {product.quantityOnHand} {product.unitOfMeasure} · {isLowStock ? "Dưới định mức" : "Đủ hàng"}
                                </span>
                              )}
                            </label>
                            <label>
                              Số lượng
                              <input type="number" min={1} value={line.quantity} onChange={(event) => updateEditLine(line.id, { quantity: event.target.value })} required style={{ minHeight: "34px", padding: "0 8px" }} />
                              {product && (
                                <span style={{ color: "var(--muted)", display: "block", fontSize: "0.74rem", marginTop: "4px" }}>
                                  Đơn vị: {product.unitOfMeasure}
                                </span>
                              )}
                            </label>
                            <label>
                              Đơn giá
                              <input type="text" inputMode="numeric" value={line.unitValue} onChange={(event) => updateEditLine(line.id, { unitValue: toMoneyInput(parseMoneyInput(event.target.value)) })} required style={{ minHeight: "34px", padding: "0 8px" }} />
                              <span style={{ color: "var(--muted)", display: "block", fontSize: "0.74rem", marginTop: "4px" }}>
                                {formatCurrency(quantity * unitValue)}
                              </span>
                            </label>
                            <button
                              className="icon-button danger-icon"
                              onClick={() => handleRemoveLine(line.id)}
                              disabled={editLines.length === 1}
                              title="Xóa dòng"
                              type="button"
                              style={{ alignSelf: "center", width: "36px", height: "36px", minHeight: "auto" }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })
                    : selectedDocumentMovements.map((movement) => {
                        const product = getProduct(movement.sku);
                        return (
                          <div
                            key={movement.id}
                            className="context-card"
                            style={{ display: "grid", gridTemplateColumns: "2.2fr 0.8fr 1.2fr", gap: "10px", alignItems: "start" }}
                          >
                            <div>
                              <strong style={{ display: "block", fontSize: "0.84rem" }}>{movement.sku}</strong>
                              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{getProductName(movement.sku)}</span>
                              {product && (
                                <span style={{ fontSize: "0.74rem", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                                  Tồn hiện tại: {product.quantityOnHand} {product.unitOfMeasure}
                                </span>
                              )}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <strong style={{ display: "block", fontSize: "0.84rem" }}>{movement.quantity}</strong>
                              <span style={{ fontSize: "0.74rem", color: "var(--muted)" }}>{product?.unitOfMeasure ?? ""}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ display: "block", fontSize: "0.82rem" }}>{formatCurrency(movement.quantity > 0 ? movement.value / movement.quantity : 0)}</span>
                              <strong style={{ fontSize: "0.84rem", color: "var(--text)" }}>{formatCurrency(movement.value)}</strong>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                <label style={{ fontSize: "0.76rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>
                  Ghi chú nội dung
                </label>
                {isEditing ? (
                  <textarea style={{ padding: "8px 10px", fontSize: "0.88rem" }} value={editNote} onChange={(event) => setEditNote(event.target.value)} rows={2} />
                ) : (
                  <div className="voucher-note-box">
                    {selectedMovement.note.trim() ? selectedMovement.note : "Không ghi nhận ghi chú bổ sung nào cho phiếu này."}
                  </div>
                )}
              </div>
            </div>

            <footer className="modal-footer">
              {isEditing ? (
                <>
                  <button className="secondary-action" onClick={() => setIsEditing(false)} type="button" style={{ minHeight: "38px" }} disabled={isSaving}>
                    Hủy bỏ
                  </button>
                  <button className="primary-action" onClick={handleSave} type="button" style={{ minHeight: "38px" }} disabled={isSaving}>
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </>
              ) : (
                <>
                  {onDeleteMovement && (
                    <button className="danger-action" onClick={handleDelete} type="button" style={{ minHeight: "38px", marginRight: "auto" }}>
                      Xóa phiếu
                    </button>
                  )}
                  <button className="secondary-action" onClick={() => setSelectedMovement(null)} type="button" style={{ minHeight: "38px" }}>
                    Đóng chi tiết
                  </button>
                  {onUpdateMovement && (
                    <button className="primary-action" onClick={() => startEditing(selectedMovement)} type="button" style={{ minHeight: "38px" }}>
                      Chỉnh sửa
                    </button>
                  )}
                </>
              )}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

