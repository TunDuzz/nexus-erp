import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Boxes,
  LayoutDashboard,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { View } from "../types";

export const viewItems = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "products", label: "Sản phẩm", icon: Boxes },
  { id: "receipts", label: "Nhập kho", icon: ArrowDownToLine },
  { id: "issues", label: "Xuất kho", icon: ArrowUpFromLine },
  { id: "disposals", label: "Hủy hàng", icon: Trash2 },
  { id: "reports", label: "Báo cáo", icon: BarChart3 },
  { id: "roles", label: "Vai trò", icon: ShieldCheck, requiredPermission: "identity.roles.manage" },
] satisfies { id: View; label: string; icon: typeof LayoutDashboard; requiredPermission?: string }[];
