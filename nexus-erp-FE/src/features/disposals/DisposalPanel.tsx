import { FormEvent, useMemo, useState } from "react";
import { PackageX, Trash2 } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { ProductTable } from "../../components/ProductTable";
import { Product, StockMovementDraft } from "../../types";
import { createId, formatCurrency } from "../../utils/formatters";

type DisposalLine = {
  sku: string;
  quantity: string;
};

const dateOnlyFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
}

function formatDateOnly(value?: string | null) {
  const date = parseDateOnly(value);
  return date ? dateOnlyFormatter.format(date) : "Chưa có";
}

function createDisposalNumber() {
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
  const time = [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0")].join("");
  return `PHH-${date}-${time}`;
}

export function DisposalPanel({
  products,
  creatorName,
  onSubmit,
  onEditProduct,
}: {
  products: Product[];
  creatorName: string;
  onSubmit: (movement: StockMovementDraft) => void | Promise<void>;
  onEditProduct?: (product: Product) => void;
}) {
  const today = getToday();
  const [lines, setLines] = useState<DisposalLine[]>([]);
  const [reason, setReason] = useState("Hủy nguyên liệu đã hết hạn sử dụng");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expiredProducts = useMemo(
    () =>
      products.filter((product) => {
        const expirationDate = parseDateOnly(product.expirationDate);
        return expirationDate !== null && expirationDate < today && product.quantityOnHand > 0;
      }),
    [products, today],
  );

  const expiringSoonProducts = useMemo(
    () =>
      products.filter((product) => {
        const expirationDate = parseDateOnly(product.expirationDate);
        if (!expirationDate || product.quantityOnHand <= 0) return false;
        const daysLeft = Math.ceil((expirationDate.getTime() - today.getTime()) / 86_400_000);
        return daysLeft >= 0 && daysLeft <= 14;
      }),
    [products, today],
  );

  const selectedLines = lines
    .map((line) => {
      const product = products.find((item) => item.sku === line.sku);
      const quantity = Number(line.quantity);
      return { line, product, quantity };
    })
    .filter((item): item is { line: DisposalLine; product: Product; quantity: number } => Boolean(item.product));

  const totalValue = selectedLines.reduce((total, item) => total + item.quantity * item.product.unitPrice, 0);
  const totalQuantity = selectedLines.reduce((total, item) => total + item.quantity, 0);

  const toggleProduct = (product: Product) => {
    setLines((current) => {
      if (current.some((line) => line.sku === product.sku)) {
        return current.filter((line) => line.sku !== product.sku);
      }

      return [...current, { sku: product.sku, quantity: String(product.quantityOnHand) }];
    });
  };

  const updateQuantity = (sku: string, quantity: string) => {
    setLines((current) => current.map((line) => (line.sku === sku ? { ...line, quantity } : line)));
  };

  const selectAllExpired = () => {
    setLines(expiredProducts.map((product) => ({ sku: product.sku, quantity: String(product.quantityOnHand) })));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (selectedLines.length === 0) {
      window.alert("Vui lòng chọn ít nhất một nguyên liệu hết hạn để hủy.");
      return;
    }

    const invalidLine = selectedLines.find((item) => item.quantity <= 0 || item.quantity > item.product.quantityOnHand);
    if (invalidLine) {
      window.alert(`Số lượng hủy của ${invalidLine.product.sku} phải lớn hơn 0 và không vượt tồn kho hiện tại.`);
      return;
    }

    const notExpiredLine = selectedLines.find((item) => {
      const expirationDate = parseDateOnly(item.product.expirationDate);
      return !expirationDate || expirationDate >= today;
    });

    if (notExpiredLine) {
      window.alert(`Nguyên liệu ${notExpiredLine.product.sku} chưa hết hạn nên không thể lập phiếu hủy hết hạn.`);
      return;
    }

    const movement: StockMovementDraft = {
      id: createId("disposal"),
      type: "issue",
      number: createDisposalNumber(),
      contact: "Bộ phận kho",
      note: reason.trim() || "Hủy nguyên liệu đã hết hạn sử dụng",
      createdAt: new Date().toISOString(),
      creator: creatorName,
      lines: selectedLines.map((item) => ({
        id: createId("disposal-line"),
        sku: item.product.sku,
        quantity: item.quantity,
        unitValue: item.product.unitPrice,
      })),
    };

    setIsSubmitting(true);

    try {
      await onSubmit(movement);
      setLines([]);
      setReason("Hủy nguyên liệu đã hết hạn sử dụng");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-grid">
      <section className="panel full-width">
        <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          <div>
            <p className="eyebrow">Kiểm soát hạn dùng</p>
            <h2>Lập phiếu hủy hàng hết hạn</h2>
          </div>
          <button className="secondary-action" disabled={expiredProducts.length === 0} onClick={selectAllExpired} type="button" style={{ width: "fit-content" }}>
            <PackageX size={16} /> Chọn toàn bộ hàng hết hạn
          </button>
        </div>

        {expiredProducts.length === 0 ? (
          <EmptyState title="Không có hàng hết hạn cần hủy" detail="Các nguyên liệu hết hạn và còn tồn kho sẽ xuất hiện tại đây." />
        ) : (
          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: "70px" }}>Chọn</th>
                    <th className="text-left">Nguyên liệu</th>
                    <th className="text-left">Hạn sử dụng</th>
                    <th className="text-right">Tồn</th>
                    <th className="text-right">Số lượng hủy</th>
                    <th className="text-right">Giá trị hủy</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredProducts.map((product) => {
                    const selectedLine = lines.find((line) => line.sku === product.sku);
                    const disposalQuantity = Number(selectedLine?.quantity ?? 0);

                    return (
                      <tr key={product.sku}>
                        <td className="text-center">
                          <input checked={Boolean(selectedLine)} onChange={() => toggleProduct(product)} type="checkbox" />
                        </td>
                        <td className="text-left">
                          <strong style={{ display: "block" }}>{product.sku}</strong>
                          <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{product.name}</span>
                        </td>
                        <td className="text-left">
                          <span className="status-badge danger">Hết hạn</span>
                          <span style={{ display: "block", marginTop: "6px", color: "var(--muted)", fontSize: "0.78rem" }}>
                            HSD: {formatDateOnly(product.expirationDate)}
                          </span>
                        </td>
                        <td className="text-right">
                          <strong>{product.quantityOnHand}</strong> {product.unitOfMeasure}
                        </td>
                        <td className="text-right">
                          <input
                            className="text-right"
                            disabled={!selectedLine || isSubmitting}
                            max={product.quantityOnHand}
                            min={1}
                            onChange={(event) => updateQuantity(product.sku, event.target.value)}
                            style={{ width: "96px", minHeight: "32px", padding: "0 8px" }}
                            type="number"
                            value={selectedLine?.quantity ?? ""}
                          />
                        </td>
                        <td className="text-right">
                          <strong>{formatCurrency(disposalQuantity * product.unitPrice)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="form-section" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
              <span className="form-section-title">Thông tin phiếu hủy</span>
              <div className="form-grid two-columns">
                <label>
                  Lý do hủy
                  <textarea disabled={isSubmitting} onChange={(event) => setReason(event.target.value)} rows={3} value={reason} />
                </label>
                <div style={{ display: "grid", alignContent: "center", gap: "8px" }}>
                  <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Tổng số lượng hủy: <strong style={{ color: "var(--text)" }}>{totalQuantity}</strong></span>
                  <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Tổng giá trị hủy: <strong style={{ color: "var(--danger)" }}>{formatCurrency(totalValue)}</strong></span>
                </div>
              </div>
            </div>

            <div className="button-row" style={{ justifyContent: "flex-end" }}>
              <button className="secondary-action" disabled={isSubmitting || lines.length === 0} onClick={() => setLines([])} type="button">
                Bỏ chọn
              </button>
              <button className="danger-action" disabled={isSubmitting || selectedLines.length === 0} type="submit">
                <Trash2 size={16} /> {isSubmitting ? "Đang lập phiếu..." : "Lập phiếu hủy"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Theo dõi gần hạn</p>
            <h2>Nguyên liệu sắp hết hạn</h2>
          </div>
        </div>
        {expiringSoonProducts.length === 0 ? (
          <EmptyState title="Không có hàng sắp hết hạn" detail="Nguyên liệu còn từ 0 đến 14 ngày trước hạn sử dụng sẽ xuất hiện ở đây." />
        ) : (
          <ProductTable products={expiringSoonProducts} onEdit={onEditProduct} />
        )}
      </section>
    </div>
  );
}

