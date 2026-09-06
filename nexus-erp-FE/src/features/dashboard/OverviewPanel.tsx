import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { MovementList } from "../../components/MovementList";
import { ProductTable } from "../../components/ProductTable";
import { Movement, Product, StockMovementDraft } from "../../types";

export function OverviewPanel({
  lowStockProducts,
  movements,
  onCreateIssue,
  onCreateReceipt,
  products,
  onUpdateMovement,
  onEditProduct,
  onDeleteMovement,
}: {
  lowStockProducts: Product[];
  movements: Movement[];
  onCreateIssue: () => void;
  onCreateReceipt: () => void;
  products: Product[];
  onUpdateMovement?: (movement: StockMovementDraft) => void | Promise<void>;
  onEditProduct?: (product: Product) => void;
  onDeleteMovement?: (movement: Movement) => void | Promise<void>;
}) {
  return (
    <div className="content-grid">
      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Danh sách hàng</p>
            <h2>Tình trạng tồn kho</h2>
          </div>
          <div className="button-row">
            <button className="secondary-action" onClick={onCreateReceipt} type="button">
              <ArrowDownToLine aria-hidden="true" />
              Nhập kho
            </button>
            <button className="secondary-action" onClick={onCreateIssue} type="button">
              <ArrowUpFromLine aria-hidden="true" />
              Xuất kho
            </button>
          </div>
        </div>
        <ProductTable products={products} onEdit={onEditProduct} />
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Cần xử lý</p>
            <h2>Dưới định mức</h2>
          </div>
        </div>
        {lowStockProducts.length === 0 ? (
          <EmptyState title="Kho đang trong tầm kiểm soát" detail="Sản phẩm dưới định mức sẽ hiển thị tại đây." />
        ) : (
          <ProductTable products={lowStockProducts} onEdit={onEditProduct} />
        )}
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Nhật ký</p>
            <h2>Nhập xuất gần đây</h2>
          </div>
        </div>
        <MovementList movements={movements.slice(0, 8)} products={products} onUpdateMovement={onUpdateMovement} onDeleteMovement={onDeleteMovement} />
      </section>
    </div>
  );
}
