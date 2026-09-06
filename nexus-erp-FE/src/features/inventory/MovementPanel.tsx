import { ArrowDownToLine, ArrowUpFromLine, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MovementList } from "../../components/MovementList";
import { ProductTable } from "../../components/ProductTable";
import { Movement, MovementType, Product, StockMovementDraft } from "../../types";
import { createId, formatCurrency } from "../../utils/formatters";
import { EmptyState } from "../../components/EmptyState";

type DraftLine = {
  id: string;
  sku: string;
  quantity: string;
  unitValue: string;
};

const toMoneyInput = (value: number) => Number(value || 0).toLocaleString("en-US");
const parseNumberInput = (value: string) => Number(value.replace(/\D/g, ""));

export function MovementPanel({
  onSubmit,
  products,
  title,
  type,
  onEditProduct,
  movements,
  onUpdateMovement,
  creatorName,
  onDeleteMovement,
}: {
  onSubmit: (movement: StockMovementDraft) => void | Promise<void>;
  products: Product[];
  title: string;
  type: MovementType;
  onEditProduct?: (product: Product) => void;
  movements: Movement[];
  onUpdateMovement?: (movement: StockMovementDraft) => void | Promise<void>;
  creatorName: string;
  onDeleteMovement?: (movement: Movement) => void | Promise<void>;
}) {
  const isReceipt = type === "receipt";
  const firstSku = products[0]?.sku ?? "";
  const [lineItems, setLineItems] = useState<DraftLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [movementQuery, setMovementQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");

  const createDraftLine = (sku = firstSku): DraftLine => {
    const usedSkus = new Set(lineItems.map((line) => line.sku).filter(Boolean));
    const product = products.find((item) => item.sku === sku) ?? products.find((item) => !usedSkus.has(item.sku)) ?? products[0];

    return {
      id: createId("line"),
      sku: product?.sku ?? "",
      quantity: "1",
      unitValue: product ? toMoneyInput(product.unitPrice) : "",
    };
  };

  useEffect(() => {
    if (lineItems.length === 0 && products.length > 0) {
      setLineItems([createDraftLine(products[0].sku)]);
    }
  }, [products.length]);

  const visibleMovements = useMemo(
    () =>
      movements.filter(
        (movement) =>
          movement.type === type &&
          [movement.number, movement.contact, movement.sku, products.find((product) => product.sku === movement.sku)?.name ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(movementQuery.trim().toLowerCase()),
      ),
    [movementQuery, movements, products, type],
  );

  const visibleProducts = useMemo(
    () =>
      products.filter((product) =>
        [product.sku, product.name, product.unitOfMeasure]
          .join(" ")
          .toLowerCase()
          .includes(productQuery.trim().toLowerCase()),
      ),
    [productQuery, products],
  );

  const totalValue = lineItems.reduce(
    (total, line) => total + Number(line.quantity || 0) * parseNumberInput(line.unitValue),
    0,
  );

  const closeForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
  };

  const updateLine = (lineId: string, update: Partial<DraftLine>) => {
    setLineItems((currentLines) => currentLines.map((line) => (line.id === lineId ? { ...line, ...update } : line)));
  };

  const updateLineSku = (lineId: string, sku: string) => {
    const product = products.find((item) => item.sku === sku);
    updateLine(lineId, {
      sku,
      unitValue: product ? toMoneyInput(product.unitPrice) : "",
    });
  };

  const addLine = () => {
    setLineItems((currentLines) => [...currentLines, createDraftLine()]);
  };

  const removeLine = (lineId: string) => {
    setLineItems((currentLines) => (currentLines.length === 1 ? currentLines : currentLines.filter((line) => line.id !== lineId)));
  };

  const handleMoneyInput = (lineId: string, value: string) => {
    const digits = value.replace(/\D/g, "");
    updateLine(lineId, { unitValue: digits ? Number(digits).toLocaleString("en-US") : "" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const lines = lineItems.map((line) => ({
      id: line.id,
      sku: line.sku.trim(),
      quantity: Number(line.quantity),
      unitValue: parseNumberInput(line.unitValue),
    }));

    if (lines.length === 0 || lines.some((line) => !line.sku || line.quantity <= 0 || line.unitValue <= 0)) {
      window.alert("Vui lòng nhập đầy đủ nguyên liệu, số lượng và đơn giá hợp lệ.");
      return;
    }

    const duplicateSku = lines.find((line, index) => lines.findIndex((item) => item.sku === line.sku) !== index)?.sku;
    if (duplicateSku) {
      window.alert("Một phiếu không nên có hai dòng cùng SKU. Hãy gộp số lượng vào một dòng để dễ kiểm kho.");
      return;
    }

    if (!isReceipt) {
      const insufficientLine = lines.find((line) => {
        const product = products.find((item) => item.sku === line.sku);
        return product ? line.quantity > product.quantityOnHand : true;
      });

      if (insufficientLine) {
        const product = products.find((item) => item.sku === insufficientLine.sku);
        window.alert(
          `Số lượng xuất của ${insufficientLine.sku} vượt tồn kho hiện có (${product?.quantityOnHand ?? 0} ${product?.unitOfMeasure ?? ""}).`,
        );
        return;
      }
    }

    const movement: StockMovementDraft = {
      id: createId(isReceipt ? "rec" : "iss"),
      type,
      number: String(formData.get("number") ?? "").trim(),
      contact: String(formData.get("contact") ?? "").trim(),
      note: String(formData.get("note") ?? "").trim(),
      createdAt: new Date().toISOString(),
      creator: creatorName,
      lines,
    };

    if (!movement.number || !movement.contact) {
      window.alert("Vui lòng nhập số chứng từ và thông tin đối tác.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(movement);
      setLineItems([createDraftLine()]);
      setIsFormOpen(false);
      event.currentTarget.reset();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể lập phiếu kho. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-grid">
      <section className="panel full-width">
        <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">{isReceipt ? "Nghiệp vụ nhập" : "Nghiệp vụ xuất"}</p>
            <h2>{title}</h2>
          </div>
          <button className="primary-action" onClick={() => setIsFormOpen(true)} style={{ width: "fit-content" }} type="button">
            <Plus size={16} /> {isReceipt ? "Lập phiếu nhập kho" : "Lập phiếu xuất kho"}
          </button>
        </div>
      </section>

      {isFormOpen && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <h3>{isReceipt ? "Lập phiếu nhập kho mới" : "Lập phiếu xuất kho mới"}</h3>
              <button className="modal-close-btn" disabled={isSubmitting} onClick={closeForm} title="Đóng" type="button">
                <X size={16} />
              </button>
            </header>

            {products.length === 0 ? (
              <div className="modal-body">
                <EmptyState title="Cần có sản phẩm trước" detail="Hãy thêm sản phẩm rồi quay lại lập phiếu kho." />
              </div>
            ) : (
              <form className="stack-form" onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-section" style={{ border: "none", padding: "12px 16px", margin: 0 }}>
                    <span className="form-section-title">1. Thông tin chung</span>
                    <div className="form-grid two-columns">
                      <label>
                        Số chứng từ
                        <input disabled={isSubmitting} name="number" placeholder={isReceipt ? "PN-0001" : "PX-0001"} required />
                      </label>
                      <label>
                        {isReceipt ? "Nhà cung cấp" : "Khách hàng / Bộ phận"}
                        <input disabled={isSubmitting} name="contact" placeholder={isReceipt ? "Công ty TNHH ABC" : "Bộ phận pha chế"} required />
                      </label>
                    </div>
                  </div>

                  <div className="form-section" style={{ border: "none", padding: "12px 16px", marginTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                      <span className="form-section-title">2. Chi tiết hàng hóa</span>
                      <button className="secondary-action" disabled={isSubmitting} onClick={addLine} style={{ width: "fit-content", minHeight: "32px" }} type="button">
                        <Plus size={14} /> Thêm nguyên liệu
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      {lineItems.map((line, index) => {
                        const product = products.find((item) => item.sku === line.sku);
                        const isLowStock = product ? product.quantityOnHand <= product.reorderLevel : false;
                        const lineTotal = Number(line.quantity || 0) * parseNumberInput(line.unitValue);

                        return (
                          <div key={line.id} className="form-grid" style={{ alignItems: "stretch", display: "grid", gap: "10px", gridTemplateColumns: "2.2fr 0.8fr 1.2fr auto" }}>
                            <label>
                              Nguyên liệu #{index + 1}
                              <select disabled={isSubmitting} value={line.sku} onChange={(event) => updateLineSku(line.id, event.target.value)} required>
                                <option value="">Chọn nguyên liệu</option>
                                {products.map((item) => (
                                  <option key={item.sku} value={item.sku}>
                                    {item.sku} - {item.name}
                                  </option>
                                ))}
                              </select>
                              {product && (
                                <small style={{ color: isLowStock ? "var(--danger)" : "var(--muted)" }}>
                                  Tồn: {product.quantityOnHand} {product.unitOfMeasure} · {isLowStock ? "Dưới định mức" : "Đủ hàng"}
                                </small>
                              )}
                            </label>

                            <label>
                              Số lượng
                              <input disabled={isSubmitting} min={1} type="number" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: event.target.value })} required />
                              {product && <small style={{ color: "var(--muted)" }}>Đơn vị: {product.unitOfMeasure}</small>}
                            </label>

                            <label>
                              {isReceipt ? "Đơn giá mua" : "Đơn giá xuất"}
                              <input disabled={isSubmitting} inputMode="numeric" type="text" value={line.unitValue} onChange={(event) => handleMoneyInput(line.id, event.target.value)} required />
                              <small style={{ color: "var(--muted)" }}>{formatCurrency(lineTotal)}</small>
                            </label>

                            <button
                              aria-label="Xóa dòng nguyên liệu"
                              className="icon-button"
                              disabled={isSubmitting || lineItems.length === 1}
                              onClick={() => removeLine(line.id)}
                              title="Xóa dòng"
                              type="button"
                              style={{ alignSelf: "center", width: "36px", height: "36px" }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                      <strong>Tổng giá trị phiếu: {formatCurrency(totalValue)}</strong>
                      <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{lineItems.length} dòng nguyên liệu</span>
                    </div>
                  </div>

                  <div className="form-section" style={{ border: "none", padding: "12px 16px", marginTop: "16px" }}>
                    <span className="form-section-title">3. Ghi chú bổ sung</span>
                    <label>
                      Lý do & nội dung khác
                      <textarea disabled={isSubmitting} name="note" placeholder="Điền lý do xuất/nhập hoặc ghi chú đặc biệt..." rows={3} />
                    </label>
                  </div>
                </div>

                <footer className="modal-footer">
                  <button className="secondary-action" disabled={isSubmitting} onClick={closeForm} type="button" style={{ minHeight: "38px" }}>
                    Hủy bỏ
                  </button>
                  <button className={`primary-action ${isSubmitting ? "loading" : ""}`} disabled={isSubmitting} type="submit" style={{ minHeight: "38px" }}>
                    {isSubmitting ? <span className="btn-spinner" /> : isReceipt ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
                    {isReceipt ? "Xác nhận nhập kho" : "Xác nhận xuất kho"}
                  </button>
                </footer>
              </form>
            )}
          </div>
        </div>
      )}

      <section className="panel full-width">
        <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">Lịch sử giao dịch</p>
            <h2>{isReceipt ? "Nhật ký nhập kho gần đây" : "Nhật ký xuất kho gần đây"}</h2>
          </div>
          <input
            style={{ width: "260px", minHeight: "36px", padding: "0 10px", borderRadius: "var(--radius-md)" }}
            type="text"
            placeholder="Tìm số chứng từ, đối tác..."
            value={movementQuery}
            onChange={(event) => setMovementQuery(event.target.value)}
          />
        </div>
        <MovementList movements={visibleMovements} products={products} onUpdateMovement={onUpdateMovement} onDeleteMovement={onDeleteMovement} />
      </section>
    </div>
  );
}
