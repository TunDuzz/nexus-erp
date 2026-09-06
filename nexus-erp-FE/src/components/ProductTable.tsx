import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { Product } from "../types";
import { formatCurrency } from "../utils/formatters";
import { EmptyState } from "./EmptyState";

const dateOnlyFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDateOnly(value?: string | null) {
  if (!value) return "Chưa có";
  return dateOnlyFormatter.format(new Date(`${value}T00:00:00`));
}

function getExpiryStatus(product: Product) {
  if (!product.expirationDate) {
    return { label: "Chưa có hạn", className: "status-badge" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expirationDate = new Date(`${product.expirationDate}T00:00:00`);
  const daysLeft = Math.ceil((expirationDate.getTime() - today.getTime()) / 86_400_000);

  if (daysLeft < 0) {
    return { label: "Hết hạn", className: "status-badge danger" };
  }

  if (daysLeft <= 14) {
    return { label: `Còn ${daysLeft} ngày`, className: "status-badge warning" };
  }

  return { label: "Còn hạn", className: "status-badge success" };
}

export function ProductTable({
  products,
  onEdit,
}: {
  products: Product[];
  onEdit?: (product: Product) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  if (products.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm"
        detail="Hãy thêm sản phẩm đầu tiên để bắt đầu nhập xuất kho."
      />
    );
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="text-left">SKU</th>
            <th className="text-left">Sản phẩm</th>
            <th className="text-left">Đơn vị</th>
            <th className="text-right">Giá</th>
            <th className="text-right">Tồn</th>
            <th className="text-left">Hạn sử dụng</th>
            <th className="text-center">Trạng thái</th>
            {onEdit && <th className="text-center" style={{ width: "80px" }}>Sửa</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.map((product) => {
            const isLow = product.quantityOnHand <= product.reorderLevel;
            const expiryStatus = getExpiryStatus(product);

            return (
              <tr key={product.id}>
                <td className="text-left">
                  <strong>{product.sku}</strong>
                </td>
                <td className="text-left">
                  <strong style={{ display: "block" }}>{product.name}</strong>
                  <span style={{ color: "var(--muted)", fontSize: "0.76rem" }}>
                    NSX: {formatDateOnly(product.manufacturingDate)}
                  </span>
                </td>
                <td className="text-left">{product.unitOfMeasure}</td>
                <td className="text-right">{formatCurrency(product.unitPrice)}</td>
                <td className="text-right">
                  <strong>{product.quantityOnHand}</strong>
                </td>
                <td className="text-left">
                  <span>{formatDateOnly(product.expirationDate)}</span>
                </td>
                <td className="text-center">
                  <div style={{ display: "inline-flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                    <span className={expiryStatus.className}>{expiryStatus.label}</span>
                    <span className={isLow ? "status-badge warning" : "status-badge success"}>
                      {isLow ? "Cần nhập hàng" : "Đủ hàng"}
                    </span>
                  </div>
                </td>
                {onEdit && (
                  <td className="text-center">
                    <button
                      className="icon-button"
                      onClick={() => onEdit(product)}
                      title="Chỉnh sửa thông tin sản phẩm"
                      type="button"
                      style={{ width: "32px", height: "32px", minHeight: "auto", padding: "0" }}
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface-strong)", fontSize: "0.82rem" }}>
          <span style={{ color: "var(--muted)" }}>Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, products.length)} trên {products.length} dòng</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              style={{ padding: "4px 10px", minHeight: "30px", fontSize: "0.78rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Trước
            </button>
            <span style={{ fontWeight: 600 }}>Trang {currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              style={{ padding: "4px 10px", minHeight: "30px", fontSize: "0.78rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
