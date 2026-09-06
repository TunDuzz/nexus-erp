import { PackagePlus, X, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { ProductTable } from "../../components/ProductTable";
import { Product } from "../../types";
import { createId } from "../../utils/formatters";

const emptyToNull = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
};

export function ProductsPanel({
  onSubmit,
  products,
  editingProduct,
  onEdit,
  onDelete,
}: {
  onSubmit: (product: Product) => Promise<void>;
  products: Product[];
  editingProduct: Product | null;
  onEdit: (product: Product | null) => void;
  onDelete?: (product: Product) => void;
}) {
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handlePriceInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectionStart = input.selectionStart;
    const originalLength = input.value.length;
    const digits = input.value.replace(/\D/g, "");

    if (!digits) {
      input.value = "";
      return;
    }

    const formatted = Number(digits).toLocaleString("en-US");
    input.value = formatted;

    if (selectionStart !== null) {
      const newLength = formatted.length;
      const cursorAdjustment = newLength - originalLength;
      const newPosition = selectionStart + cursorAdjustment;
      input.setSelectionRange(newPosition, newPosition);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const manufacturingDate = emptyToNull(formData.get("manufacturingDate"));
    const expirationDate = emptyToNull(formData.get("expirationDate"));

    if (manufacturingDate && expirationDate && expirationDate < manufacturingDate) {
      alert("Hạn sử dụng không được nhỏ hơn ngày sản xuất.");
      return;
    }

    const product: Product = {
      id: editingProduct?.id ?? createId("prd"),
      sku: editingProduct ? editingProduct.sku : String(formData.get("sku") ?? "").trim().toUpperCase(),
      name: String(formData.get("name") ?? "").trim(),
      unitOfMeasure: String(formData.get("unitOfMeasure") ?? "Cái").trim(),
      unitPrice: Number(String(formData.get("unitPrice") ?? "").replace(/\D/g, "")),
      quantityOnHand: Number(formData.get("initialQuantity") ?? 0),
      reorderLevel: Number(formData.get("reorderLevel") ?? 0),
      manufacturingDate,
      expirationDate,
    };

    setIsSubmitting(true);

    try {
      await onSubmit(product);
      onEdit(null);
      setIsFormOpen(false);
      form.reset();
      setFormKey((key) => key + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể lưu sản phẩm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showForm = isFormOpen || editingProduct !== null;

  const handleClose = () => {
    setIsFormOpen(false);
    onEdit(null);
  };

  const filteredProducts = products.filter((product) =>
    [product.sku, product.name, product.unitOfMeasure, product.manufacturingDate ?? "", product.expirationDate ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <p className="eyebrow">Danh mục</p>
          <h2 style={{ margin: 0 }}>Sản phẩm hiện có trong kho</h2>
        </div>
        <button
          className="primary-action"
          onClick={() => setIsFormOpen(true)}
          style={{ width: "fit-content" }}
          type="button"
        >
          <Plus size={16} /> Thêm sản phẩm mới
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3>{editingProduct ? `Chỉnh sửa sản phẩm: ${editingProduct.sku}` : "Thêm sản phẩm mới"}</h3>
              <button className="modal-close-btn" onClick={handleClose} title="Đóng" type="button">
                <X size={16} />
              </button>
            </header>

            <form className="stack-form" key={`${formKey}-${editingProduct?.id ?? "new"}`} onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-section" style={{ border: "none", padding: "12px 16px", margin: 0 }}>
                  <span className="form-section-title">1. Định danh sản phẩm</span>
                  <div className="form-grid two-columns">
                    <label>
                      Mã SKU sản phẩm
                      <input
                        defaultValue={editingProduct?.sku ?? ""}
                        disabled={isSubmitting || !!editingProduct}
                        name="sku"
                        placeholder="VD: CF-MILK-1L"
                        required
                      />
                    </label>
                    <label>
                      Tên hàng hóa
                      <input
                        defaultValue={editingProduct?.name ?? ""}
                        disabled={isSubmitting}
                        name="name"
                        placeholder="VD: Sữa tươi thanh trùng"
                        required
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section" style={{ border: "none", padding: "12px 16px", marginTop: "16px" }}>
                  <span className="form-section-title">2. Giá & Quản lý kho</span>
                  <div className="form-grid four-columns">
                    <label>
                      Đơn vị tính
                      <input defaultValue={editingProduct?.unitOfMeasure ?? "Cái"} disabled={isSubmitting} name="unitOfMeasure" required />
                    </label>
                    <label>
                      Đơn giá vốn (VND)
                      <input
                        defaultValue={editingProduct ? Number(editingProduct.unitPrice).toLocaleString("en-US") : ""}
                        disabled={isSubmitting}
                        name="unitPrice"
                        onInput={handlePriceInput}
                        placeholder="VD: 10,000"
                        required
                        type="text"
                      />
                    </label>
                    <label>
                      {editingProduct ? "Số lượng hiện tại" : "Số lượng tồn đầu"}
                      <input defaultValue={editingProduct?.quantityOnHand ?? ""} disabled={isSubmitting} min={0} name="initialQuantity" required type="number" />
                    </label>
                    <label>
                      Định mức tối thiểu
                      <input defaultValue={editingProduct?.reorderLevel ?? ""} disabled={isSubmitting} min={0} name="reorderLevel" required type="number" />
                    </label>
                  </div>
                </div>

                <div className="form-section" style={{ border: "none", padding: "12px 16px", marginTop: "16px" }}>
                  <span className="form-section-title">3. Kiểm tra hạn dùng</span>
                  <div className="form-grid two-columns">
                    <label>
                      Ngày sản xuất
                      <input defaultValue={editingProduct?.manufacturingDate ?? ""} disabled={isSubmitting} name="manufacturingDate" type="date" />
                    </label>
                    <label>
                      Hạn sử dụng
                      <input defaultValue={editingProduct?.expirationDate ?? ""} disabled={isSubmitting} name="expirationDate" type="date" />
                    </label>
                  </div>
                </div>
              </div>

              <footer className="modal-footer">
                {editingProduct && onDelete && (
                  <button className="danger-action" disabled={isSubmitting} onClick={() => onDelete(editingProduct)} type="button" style={{ minHeight: "38px", marginRight: "auto" }}>
                    Xóa sản phẩm
                  </button>
                )}
                <button className="secondary-action" disabled={isSubmitting} onClick={handleClose} type="button" style={{ minHeight: "38px" }}>
                  Hủy bỏ
                </button>
                <button className={`primary-action ${isSubmitting ? "loading" : ""}`} disabled={isSubmitting} type="submit" style={{ minHeight: "38px" }}>
                  {isSubmitting ? <span className="btn-spinner" /> : <PackagePlus size={16} />}
                  {editingProduct ? "Cập nhật sản phẩm" : "Lưu sản phẩm mới"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <section className="panel">
        <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">Tra cứu</p>
            <h2>Danh mục sản phẩm</h2>
          </div>
          <input
            style={{ width: "260px", minHeight: "36px", padding: "0 10px", borderRadius: "var(--radius-md)" }}
            type="text"
            placeholder="Tìm kiếm sản phẩm (SKU, tên...)"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <ProductTable products={filteredProducts} onEdit={onEdit} />
      </section>
    </>
  );
}
