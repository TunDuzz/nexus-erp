import { BarChart3, Calendar, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, PieChart, Info, Trash2, PackageX } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { MovementList } from "../../components/MovementList";
import { Movement, Product, StockMovementDraft } from "../../types";
import { formatCurrency } from "../../utils/formatters";

const getDocumentId = (movement: Movement) => movement.documentId ?? movement.id.split(":")[0];

export function ReportsPanel({
  movements,
  products,
  onUpdateMovement,
  onDeleteMovement,
}: {
  movements: Movement[];
  products: Product[];
  onUpdateMovement?: (movement: StockMovementDraft) => void | Promise<void>;
  onDeleteMovement?: (movement: Movement) => void | Promise<void>;
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(currentMonth);
  const [reportTab, setReportTab] = useState<"comparison" | "disposal-trend" | "top-disposals" | "reasons">("comparison");

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);

    movements.forEach((movement) => {
      const year = new Date(movement.createdAt).getFullYear();
      if (!Number.isNaN(year)) {
        years.add(year);
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear, movements]);

  const yearlyMovements = useMemo(
    () => movements.filter((movement) => new Date(movement.createdAt).getFullYear() === selectedYear),
    [movements, selectedYear],
  );

  const filteredMovements = useMemo(
    () =>
      yearlyMovements.filter((movement) => {
        if (selectedMonth === "all") return true;
        return new Date(movement.createdAt).getMonth() + 1 === selectedMonth;
      }),
    [selectedMonth, yearlyMovements],
  );

  // Group monthly stats
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthMovements = yearlyMovements.filter((m) => new Date(m.createdAt).getMonth() + 1 === month);
      
      const receiptValue = monthMovements
        .filter((m) => m.type === "receipt")
        .reduce((sum, m) => sum + m.value, 0);
        
      const normalIssueValue = monthMovements
        .filter((m) => m.type === "issue" && !m.number.startsWith("PHH-"))
        .reduce((sum, m) => sum + m.value, 0);
        
      const disposalValue = monthMovements
        .filter((m) => m.type === "issue" && m.number.startsWith("PHH-"))
        .reduce((sum, m) => sum + m.value, 0);

      return { month, receiptValue, normalIssueValue, disposalValue };
    });
  }, [yearlyMovements]);

  // Main metrics (Yearly)
  const totalReceiptValue = useMemo(() => {
    return yearlyMovements
      .filter((m) => m.type === "receipt")
      .reduce((sum, m) => sum + m.value, 0);
  }, [yearlyMovements]);

  const totalNormalIssueValue = useMemo(() => {
    return yearlyMovements
      .filter((m) => m.type === "issue" && !m.number.startsWith("PHH-"))
      .reduce((sum, m) => sum + m.value, 0);
  }, [yearlyMovements]);

  const totalDisposalValue = useMemo(() => {
    return yearlyMovements
      .filter((m) => m.type === "issue" && m.number.startsWith("PHH-"))
      .reduce((sum, m) => sum + m.value, 0);
  }, [yearlyMovements]);

  const balanceValue = totalReceiptValue - totalNormalIssueValue - totalDisposalValue;

  const maxMonthValue = Math.max(
    ...monthlyData.flatMap((item) => [item.receiptValue, item.normalIssueValue]),
    1
  );

  const maxDisposalMonthValue = Math.max(
    ...monthlyData.map((item) => item.disposalValue),
    1
  );

  // Top Disposed Products
  const topDisposedProducts = useMemo(() => {
    const map = new Map<string, { sku: string; name: string; quantity: number; value: number }>();
    const disposals = yearlyMovements.filter((m) => m.type === "issue" && m.number.startsWith("PHH-"));
    
    for (const m of disposals) {
      const prod = products.find((p) => p.sku === m.sku);
      const name = prod ? prod.name : "Nguyên liệu không xác định";
      const existing = map.get(m.sku) || { sku: m.sku, name, quantity: 0, value: 0 };
      existing.quantity += m.quantity;
      existing.value += m.value;
      map.set(m.sku, existing);
    }
    
    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [yearlyMovements, products]);

  // Disposal Reasons Breakdown
  const disposalReasons = useMemo(() => {
    const map = new Map<string, { reason: string; count: number; value: number }>();
    const disposals = yearlyMovements.filter((m) => m.type === "issue" && m.number.startsWith("PHH-"));
    
    for (const m of disposals) {
      const r = m.note.trim() || "Hủy nguyên liệu đã hết hạn sử dụng";
      const existing = map.get(r) || { reason: r, count: 0, value: 0 };
      existing.count += 1;
      existing.value += m.value;
      map.set(r, existing);
    }
    
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [yearlyMovements]);

  return (
    <div className="content-grid">
      <section className="status-strip panel full-width" aria-label="Tóm tắt báo cáo" style={{ background: "transparent", border: 0, boxShadow: "none", padding: 0 }}>
        <article className="metric-card green">
          <div className="metric-card-content">
            <span>Tổng nhập kho ({selectedYear})</span>
            <strong>{formatCurrency(totalReceiptValue)}</strong>
            <small>
              <TrendingUp size={14} /> Tích lũy giá trị nhập
            </small>
          </div>
          <div className="metric-icon-badge">
            <TrendingUp size={20} />
          </div>
        </article>

        <article className="metric-card amber">
          <div className="metric-card-content">
            <span>Xuất kho sản xuất ({selectedYear})</span>
            <strong>{formatCurrency(totalNormalIssueValue)}</strong>
            <small>
              <TrendingDown size={14} /> Tích lũy giá trị xuất
            </small>
          </div>
          <div className="metric-icon-badge">
            <TrendingDown size={20} />
          </div>
        </article>

        <article className="metric-card red">
          <div className="metric-card-content">
            <span>Giá trị hủy hàng ({selectedYear})</span>
            <strong>{formatCurrency(totalDisposalValue)}</strong>
            <small>
              <AlertTriangle size={14} /> Hàng hết hạn & hư hỏng
            </small>
          </div>
          <div className="metric-icon-badge">
            <AlertTriangle size={20} />
          </div>
        </article>

        <article className="metric-card neutral">
          <div className="metric-card-content">
            <span>Chênh lệch trị giá</span>
            <strong>{formatCurrency(balanceValue)}</strong>
            <small>
              <RefreshCw size={12} /> Cân đối giá trị kho
            </small>
          </div>
          <div className="metric-icon-badge">
            <RefreshCw size={20} />
          </div>
        </article>

        <article className="metric-card neutral">
          <div className="metric-card-content" style={{ marginRight: "16px", flexGrow: 1 }}>
            <span>Bộ lọc thời gian</span>
            <div style={{ marginTop: "6px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.78rem", color: "var(--muted)", fontWeight: 500 }}>
                Năm báo cáo
                <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} style={{ minHeight: "34px", fontSize: "0.84rem", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface)", width: "100%", maxWidth: "140px" }}>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      Năm {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="metric-icon-badge">
            <Calendar size={20} />
          </div>
        </article>
      </section>

      <section className="panel full-width">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p className="eyebrow">Trực quan hóa dữ liệu năm {selectedYear}</p>
            <h2>Báo cáo chi tiết & Phân tích kho</h2>
          </div>
          
          <div className="segmented-control" style={{ display: "flex", width: "fit-content", minHeight: "36px" }}>
            <button className={reportTab === "comparison" ? "selected" : ""} onClick={() => setReportTab("comparison")} style={{ padding: "0 14px", fontSize: "0.82rem" }}>
              <BarChart3 size={14} style={{ marginRight: "4px", display: "inline" }} /> Đối chiếu Nhập - Xuất
            </button>
            <button className={reportTab === "disposal-trend" ? "selected" : ""} onClick={() => setReportTab("disposal-trend")} style={{ padding: "0 14px", fontSize: "0.82rem" }}>
              <TrendingDown size={14} style={{ marginRight: "4px", display: "inline" }} /> Xu hướng Hủy hàng
            </button>
            <button className={reportTab === "top-disposals" ? "selected" : ""} onClick={() => setReportTab("top-disposals")} style={{ padding: "0 14px", fontSize: "0.82rem" }}>
              <PackageX size={14} style={{ marginRight: "4px", display: "inline" }} /> Top hàng hủy
            </button>
            <button className={reportTab === "reasons" ? "selected" : ""} onClick={() => setReportTab("reasons")} style={{ padding: "0 14px", fontSize: "0.82rem" }}>
              <PieChart size={14} style={{ marginRight: "4px", display: "inline" }} /> Lý do hủy
            </button>
          </div>
        </div>

        {/* Tab 1: Đối chiếu Nhập - Xuất */}
        {reportTab === "comparison" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(42px, 1fr))", gap: "12px", alignItems: "end", minHeight: "260px", borderBottom: "1px solid var(--border)", padding: "16px 0 0" }}>
              {monthlyData.map((item) => {
                const receiptHeight = Math.max((item.receiptValue / maxMonthValue) * 210, item.receiptValue > 0 ? 12 : 0);
                const issueHeight = Math.max((item.normalIssueValue / maxMonthValue) * 210, item.normalIssueValue > 0 ? 12 : 0);
                const isSelected = selectedMonth === item.month;

                return (
                  <button
                    key={item.month}
                    onClick={() => setSelectedMonth(item.month)}
                    type="button"
                    style={{
                      display: "grid",
                      gridTemplateRows: "1fr auto",
                      gap: "8px",
                      minHeight: "242px",
                      border: 0,
                      background: isSelected ? "color-mix(in srgb, var(--accent) 9%, transparent)" : "transparent",
                      borderRadius: "var(--radius-md)",
                      padding: "8px 6px",
                      cursor: "pointer",
                    }}
                    title={`Tháng ${item.month}: nhập ${formatCurrency(item.receiptValue)}, xuất sản xuất ${formatCurrency(item.normalIssueValue)}`}
                  >
                    <span style={{ display: "flex", alignItems: "end", justifyContent: "center", gap: "4px" }}>
                      <span style={{ width: "16px", height: `${receiptHeight}px`, borderRadius: "4px 4px 0 0", background: "var(--accent)", display: "block" }} />
                      <span style={{ width: "16px", height: `${issueHeight}px`, borderRadius: "4px 4px 0 0", background: "var(--amber)", display: "block" }} />
                    </span>
                    <strong style={{ color: isSelected ? "var(--accent-strong)" : "var(--muted)", fontSize: "0.8rem" }}>T{item.month}</strong>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "18px", marginTop: "14px", color: "var(--muted)", fontSize: "0.82rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><i style={{ width: "10px", height: "10px", background: "var(--accent)", borderRadius: "2px" }} /> Nhập kho</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><i style={{ width: "10px", height: "10px", background: "var(--amber)", borderRadius: "2px" }} /> Xuất kho sản xuất</span>
              <button className="secondary-action" onClick={() => setSelectedMonth("all")} type="button" style={{ minHeight: "30px", marginLeft: "auto" }}>
                Xem cả năm
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Xu hướng Hủy hàng */}
        {reportTab === "disposal-trend" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(42px, 1fr))", gap: "12px", alignItems: "end", minHeight: "260px", borderBottom: "1px solid var(--border)", padding: "16px 0 0" }}>
              {monthlyData.map((item) => {
                const disposalHeight = Math.max((item.disposalValue / maxDisposalMonthValue) * 210, item.disposalValue > 0 ? 12 : 0);
                const isSelected = selectedMonth === item.month;

                return (
                  <button
                    key={item.month}
                    onClick={() => setSelectedMonth(item.month)}
                    type="button"
                    style={{
                      display: "grid",
                      gridTemplateRows: "1fr auto",
                      gap: "8px",
                      minHeight: "242px",
                      border: 0,
                      background: isSelected ? "color-mix(in srgb, var(--danger) 9%, transparent)" : "transparent",
                      borderRadius: "var(--radius-md)",
                      padding: "8px 6px",
                      cursor: "pointer",
                    }}
                    title={`Tháng ${item.month}: giá trị hủy hàng ${formatCurrency(item.disposalValue)}`}
                  >
                    <span style={{ display: "flex", alignItems: "end", justifyContent: "center" }}>
                      <span style={{ width: "24px", height: `${disposalHeight}px`, borderRadius: "4px 4px 0 0", background: "var(--danger)", display: "block" }} />
                    </span>
                    <strong style={{ color: isSelected ? "var(--danger)" : "var(--muted)", fontSize: "0.8rem" }}>T{item.month}</strong>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "18px", marginTop: "14px", color: "var(--muted)", fontSize: "0.82rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><i style={{ width: "10px", height: "10px", background: "var(--danger)", borderRadius: "2px" }} /> Trị giá hủy hàng (Hết hạn / Hư hỏng)</span>
              <button className="secondary-action" onClick={() => setSelectedMonth("all")} type="button" style={{ minHeight: "30px", marginLeft: "auto" }}>
                Xem cả năm
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Top nguyên liệu bị hủy nhiều nhất */}
        {reportTab === "top-disposals" && (
          <div style={{ padding: "12px 0" }}>
            {topDisposedProducts.length === 0 ? (
              <EmptyState title="Chưa ghi nhận hàng hủy nào" detail="Dữ liệu hàng hủy trong năm nay sẽ hiển thị tại đây khi lập phiếu hủy." />
            ) : (
              <div style={{ display: "grid", gap: "18px" }}>
                <p style={{ fontSize: "0.86rem", color: "var(--muted)", margin: 0 }}>
                  Top 5 nguyên liệu bị hao thoát nhiều nhất trong năm {selectedYear} (tính theo tổng giá trị):
                </p>
                {topDisposedProducts.map((item, index) => {
                  const percentage = totalDisposalValue > 0 ? (item.value / totalDisposalValue) * 100 : 0;
                  return (
                    <div key={item.sku} style={{ display: "grid", gridTemplateColumns: "140px 1fr 140px", gap: "16px", alignItems: "center" }}>
                      <div>
                        <strong style={{ display: "block", fontSize: "0.86rem" }}>{item.sku}</strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div>
                        <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${percentage}%`, height: "100%", background: "var(--danger)", borderRadius: "999px" }} />
                        </div>
                        <span style={{ fontSize: "0.74rem", color: "var(--muted)", display: "block", marginTop: "4px" }}>
                          Số lượng: {item.quantity} · Chiếm {percentage.toFixed(1)}% tổng giá trị hủy
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: "0.92rem", color: "var(--danger)" }}>{formatCurrency(item.value)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Lý do hủy hàng */}
        {reportTab === "reasons" && (
          <div style={{ padding: "12px 0" }}>
            {disposalReasons.length === 0 ? (
              <EmptyState title="Chưa có dữ liệu hủy hàng" detail="Thông tin phân tích nguyên nhân sẽ được cập nhật khi có phiếu hủy hàng." />
            ) : (
              <div className="table-wrap">
                <table style={{ minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th className="text-left">Nguyên nhân / Nội dung ghi chú</th>
                      <th className="text-right" style={{ width: "180px", whiteSpace: "nowrap" }}>Số lượt ghi nhận</th>
                      <th className="text-right" style={{ width: "200px" }}>Tổng trị giá thiệt hại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disposalReasons.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-left" style={{ fontWeight: 600 }}>{item.reason}</td>
                        <td className="text-right" style={{ whiteSpace: "nowrap" }}>{item.count} dòng nguyên liệu</td>
                        <td className="text-right" style={{ color: "var(--danger)", fontWeight: 700 }}>
                          {formatCurrency(item.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel full-width">
        <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">Chi tiết giao dịch</p>
            <h2>
              {selectedMonth === "all"
                ? `Danh sách phiếu kho năm ${selectedYear}`
                : `Danh sách phiếu kho tháng ${selectedMonth}/${selectedYear}`}
            </h2>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "170px", fontSize: "0.78rem", color: "var(--muted)", fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} />
              Tháng
            </span>
            <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value === "all" ? "all" : Number(event.target.value))} style={{ minHeight: "36px", padding: "0 10px", borderRadius: "var(--radius-md)" }}>
              <option value="all">Tất cả tháng</option>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  Tháng {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <MovementList movements={filteredMovements} products={products} onUpdateMovement={onUpdateMovement} onDeleteMovement={onDeleteMovement} />
      </section>
    </div>
  );
}



