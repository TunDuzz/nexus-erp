import { useEffect, useMemo, useRef, useState } from "react";
import { Users, Shield, Warehouse, Key } from "lucide-react";
import { AppLayout } from "./components/AppLayout";
import { AuthScreen } from "./components/AuthScreen";
import { MetricCard } from "./components/MetricCard";
import { ToastContainer, ToastItem, ToastType } from "./components/Toast";
import { OverviewPanel } from "./features/dashboard/OverviewPanel";
import { MovementPanel } from "./features/inventory/MovementPanel";
import { DisposalPanel } from "./features/disposals/DisposalPanel";
import { ProductsPanel } from "./features/products/ProductsPanel";
import { ReportsPanel } from "./features/reports/ReportsPanel";
import { RoleManagementPanel } from "./features/roles/RoleManagementPanel";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { AuthPayload, Movement, Product, RoleDefinition, Theme, UserRole, UserSession, View, AppNotification, StockMovementDraft } from "./types";
import { formatCurrency } from "./utils/formatters";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5062";

type AuthResponse = {
  email: string;
  fullName: string;
  accessToken: string;
  roles: string[];
  permissions: string[];
};

type StockReceiptResponse = {
  id: string;
  receiptNumber: string;
  supplierName: string;
  receivedAtUtc: string;
  note?: string | null;
  lines: Array<{
    id: string;
    sku: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
};

type StockIssueResponse = {
  id: string;
  issueNumber: string;
  requestedBy: string;
  issuedAtUtc: string;
  note?: string | null;
  lines: Array<{
    id: string;
    sku: string;
    quantity: number;
    reason?: string | null;
  }>;
};

function parseJwtPayload(token: string): { exp?: number; email?: string } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

async function parseError(response: Response) {
  const text = await response.text();

  if (!text) {
    return `Request failed with status ${response.status}`;
  }

  try {
    const json = JSON.parse(text) as {
      code?: string;
      description?: string;
      message?: string;
      error?: { description?: string; message?: string };
    };

    return json.message ?? json.description ?? json.error?.message ?? json.error?.description ?? text;
  } catch {
    return text;
  }
}

function App() {
  const [theme, setTheme] = useLocalStorageState<Theme>("nexus-theme", "light");
  const [user, setUser] = useLocalStorageState<UserSession | null>("nexus-session", null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activeView, setActiveView] = useLocalStorageState<View>("nexus-active-view", "overview");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const [notifications, setNotifications] = useLocalStorageState<AppNotification[]>("nexus-notifications", []);

  useEffect(() => {
    if (!products.length) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setNotifications((currentNotifications) => {
      const existing = currentNotifications || [];
      const newNotifications: AppNotification[] = [];

      products.forEach((product) => {
        const isLowStock = product.quantityOnHand <= product.reorderLevel;
        const lowStockWarningExists =
          existing.some((n) => n.title === "Cảnh báo tồn kho thấp" && n.message.includes(`SKU: ${product.sku}`)) ||
          newNotifications.some((n) => n.title === "Cảnh báo tồn kho thấp" && n.message.includes(`SKU: ${product.sku}`));

        if (isLowStock && !lowStockWarningExists) {
          newNotifications.push({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: "Cảnh báo tồn kho thấp",
            message: `Sản phẩm "${product.name}" (SKU: ${product.sku}) hiện chỉ còn ${product.quantityOnHand} ${product.unitOfMeasure} (Định mức tối thiểu: ${product.reorderLevel}).`,
            createdAt: new Date().toISOString(),
            read: false,
            type: "warning",
          });
        }

        if (product.expirationDate) {
          const expirationDate = new Date(`${product.expirationDate}T00:00:00`);
          const daysLeft = Math.ceil((expirationDate.getTime() - today.getTime()) / 86_400_000);
          const expiryWarningExists =
            existing.some((n) => n.title.includes("hạn sử dụng") && n.message.includes(`SKU: ${product.sku}`)) ||
            newNotifications.some((n) => n.title.includes("hạn sử dụng") && n.message.includes(`SKU: ${product.sku}`));

          if (daysLeft < 0 && !expiryWarningExists) {
            newNotifications.push({
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: "Nguyên liệu hết hạn sử dụng",
              message: `Sản phẩm "${product.name}" (SKU: ${product.sku}) đã hết hạn từ ngày ${product.expirationDate}.`,
              createdAt: new Date().toISOString(),
              read: false,
              type: "error",
            });
          } else if (daysLeft >= 0 && daysLeft <= 14 && !expiryWarningExists) {
            newNotifications.push({
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: "Nguyên liệu sắp hết hạn sử dụng",
              message: `Sản phẩm "${product.name}" (SKU: ${product.sku}) còn ${daysLeft} ngày trước hạn sử dụng ${product.expirationDate}.`,
              createdAt: new Date().toISOString(),
              read: false,
              type: "warning",
            });
          }
        }
      });

      if (newNotifications.length === 0) return existing;
      return [...newNotifications, ...existing];
    });
  }, [products]);

  const addToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addNotification = (title: string, message: string, type: AppNotification["type"] = "info") => {
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      type,
    };
    setNotifications((current) => [newNotification, ...current || []]);
  };

  const markAllAsRead = () => {
    setNotifications((current) => (current || []).map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((current) => (current || []).filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const clearSession = () => {
    window.localStorage.removeItem("nexus-session");
    window.localStorage.removeItem("nexus-movements");
    window.localStorage.removeItem("nexus-notifications");
    setUser(null);
    setProducts([]);
    setMovements([]);
    setNotifications([]);
    setEditingProduct(null);
    setRoleDefinitions([]);
    setUserRoles([]);
    setActiveView("overview");
  };

  const handleUnauthorized = (message?: string) => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    clearSession();
    window.alert(message || "Phiên đăng nhập đã hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.");
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 1000);
  };

  useEffect(() => {
    if (!user?.accessToken) return;

    const payload = parseJwtPayload(user.accessToken);
    if (!payload?.exp) return;

    const expiresAtMs = payload.exp * 1000;
    const now = Date.now();
    const timeRemaining = expiresAtMs - now;

    if (timeRemaining <= 0) {
      handleUnauthorized("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    const timer = setTimeout(() => {
      handleUnauthorized("Phiên làm việc đã hết hạn tại thời điểm quy định. Bạn đã được tự động đăng xuất để bảo mật.");
    }, timeRemaining);

    return () => clearTimeout(timer);
  }, [user?.accessToken]);

  const authorizedFetch = (path: string, init: RequestInit = {}, token = user?.accessToken) => {
    if (token) {
      const payload = parseJwtPayload(token);
      if (payload?.exp && payload.exp * 1000 <= Date.now()) {
        handleUnauthorized("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return Promise.reject(new Error("Token expired"));
      }
    }

    return fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  };

  const ensureOk = async (response: Response) => {
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    if (!response.ok) {
      throw new Error(await parseError(response));
    }
  };

  const mapReceiptToMovements = (receipt: StockReceiptResponse): Movement[] => {
    return receipt.lines.map((line) => ({
      id: `${receipt.id}:${line.id}`,
      documentId: receipt.id,
      lineId: line.id,
      type: "receipt",
      number: receipt.receiptNumber,
      contact: receipt.supplierName,
      sku: line.sku,
      quantity: line.quantity,
      value: line.lineTotal,
      note: receipt.note ?? "",
      createdAt: receipt.receivedAtUtc,
    }));
  };

  const mapIssueToMovements = (issue: StockIssueResponse, currentProducts: Product[]): Movement[] => {
    return issue.lines.map((line) => {
      const product = currentProducts.find((item) => item.sku === line.sku);
      const unitPrice = product?.unitPrice ?? 0;

      return {
        id: `${issue.id}:${line.id}`,
        documentId: issue.id,
        lineId: line.id,
        type: "issue",
        number: issue.issueNumber,
        contact: issue.requestedBy,
        sku: line.sku,
        quantity: line.quantity,
        value: line.quantity * unitPrice,
        note: issue.note ?? line.reason ?? "",
        createdAt: issue.issuedAtUtc,
      };
    });
  };

  const loadProducts = async (token = user?.accessToken) => {
    if (!token) return [];

    const response = await authorizedFetch("/api/inventory/products", { method: "GET" }, token);
    await ensureOk(response);

    const loadedProducts = (await response.json()) as Product[];
    setProducts(loadedProducts);

    return loadedProducts;
  };

  const loadMovements = async (currentProducts: Product[], token = user?.accessToken) => {
    if (!token) return [];

    const [receiptsResponse, issuesResponse] = await Promise.all([
      authorizedFetch("/api/inventory/stock-receipts", { method: "GET" }, token),
      authorizedFetch("/api/inventory/stock-issues", { method: "GET" }, token),
    ]);

    await ensureOk(receiptsResponse);
    await ensureOk(issuesResponse);

    const receipts = (await receiptsResponse.json()) as StockReceiptResponse[];
    const issues = (await issuesResponse.json()) as StockIssueResponse[];
    const loadedMovements = [
      ...receipts.flatMap(mapReceiptToMovements),
      ...issues.flatMap((issue) => mapIssueToMovements(issue, currentProducts)),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setMovements(loadedMovements);

    return loadedMovements;
  };

  const loadInventory = async (token = user?.accessToken) => {
    const loadedProducts = await loadProducts(token);
    await loadMovements(loadedProducts, token);
  };

  const loadRoleManagement = async (token = user?.accessToken, permissions = user?.permissions ?? []) => {
    if (!token || !permissions.includes("identity.roles.manage")) return;

    const [rolesResponse, usersResponse] = await Promise.all([
      authorizedFetch("/api/identity/roles", { method: "GET" }, token),
      authorizedFetch("/api/identity/users", { method: "GET" }, token),
    ]);

    await ensureOk(rolesResponse);
    await ensureOk(usersResponse);

    setRoleDefinitions((await rolesResponse.json()) as RoleDefinition[]);
    setUserRoles((await usersResponse.json()) as UserRole[]);
  };

  const updateUserRoles = async (userId: string, roles: string[]) => {
    const response = await authorizedFetch(`/api/identity/users/${encodeURIComponent(userId)}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles }),
    });

    await ensureOk(response);
    const updatedUser = (await response.json()) as UserRole;
    setUserRoles((current) => current.map((item) => (item.userId === updatedUser.userId ? updatedUser : item)));
    addToast(`Đã cập nhật vai trò cho ${updatedUser.fullName || updatedUser.email}.`, "success");
  };

  useEffect(() => {
    if (!user?.accessToken) return;

    loadInventory(user.accessToken).catch((error) => {
      addToast(error instanceof Error ? error.message : "Không thể tải dữ liệu tồn kho", "error");
    });

    loadRoleManagement(user.accessToken, user.permissions).catch((error) => {
      addToast(error instanceof Error ? error.message : "Không thể tải dữ liệu phân quyền", "error");
    });
  }, [user?.accessToken]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.quantityOnHand <= product.reorderLevel),
    [products],
  );

  const inventoryValue = useMemo(
    () => products.reduce((total, product) => total + product.quantityOnHand * product.unitPrice, 0),
    [products],
  );

  const handleAuth = async (payload: AuthPayload) => {
    const isRegister = payload.mode === "register";
    const response = await fetch(`${apiBaseUrl}/api/identity/${isRegister ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isRegister
          ? {
              email: payload.email,
              password: payload.password,
              firstName: payload.firstName,
              lastName: payload.lastName,
            }
          : {
              email: payload.email,
              password: payload.password,
            },
      ),
    });

    if (!response.ok) {
      throw new Error(response.status === 401 ? "Email hoặc mật khẩu không đúng." : await parseError(response));
    }

    const session = (await response.json()) as AuthResponse;
    setUser(session);
    await loadInventory(session.accessToken);
    if (session.permissions.includes("identity.roles.manage")) {
      await loadRoleManagement(session.accessToken, session.permissions);
    }
    addToast(`Chào mừng ${session.fullName} đã đăng nhập!`, "success");
  };

  const upsertProduct = async (product: Product) => {
    const isUpdate = products.some((item) => item.sku === product.sku);
    const response = await authorizedFetch(`/api/inventory/products${isUpdate ? `/${encodeURIComponent(product.sku)}` : ""}`, {
      method: isUpdate ? "PUT" : "POST",
      body: JSON.stringify(
        isUpdate
          ? {
              name: product.name,
              unitOfMeasure: product.unitOfMeasure,
              unitPrice: product.unitPrice,
              reorderLevel: product.reorderLevel,
              manufacturingDate: product.manufacturingDate,
              expirationDate: product.expirationDate,
            }
          : {
              sku: product.sku,
              name: product.name,
              unitOfMeasure: product.unitOfMeasure,
              unitPrice: product.unitPrice,
              initialQuantity: product.quantityOnHand,
              reorderLevel: product.reorderLevel,
              manufacturingDate: product.manufacturingDate,
              expirationDate: product.expirationDate,
            },
      ),
    });

    await ensureOk(response);

    const savedProduct = (await response.json()) as Product;
    setProducts((currentProducts) => {
      const exists = currentProducts.some((item) => item.sku === savedProduct.sku);

      if (!exists) {
        return [savedProduct, ...currentProducts];
      }

      return currentProducts.map((item) => (item.sku === savedProduct.sku ? savedProduct : item));
    });

    addToast(
      isUpdate
        ? `Đã cập nhật thông tin sản phẩm SKU "${savedProduct.sku}" thành công!`
        : `Đã thêm mới sản phẩm SKU "${savedProduct.sku}" thành công!`,
      "success",
    );
  };

  const applyMovement = async (movement: StockMovementDraft) => {
    const isReceipt = movement.type === "receipt";
    const response = await authorizedFetch(`/api/inventory/${isReceipt ? "stock-receipts" : "stock-issues"}`, {
      method: "POST",
      body: JSON.stringify(
        isReceipt
          ? {
              receiptNumber: movement.number,
              supplierName: movement.contact,
              receivedAtUtc: movement.createdAt,
              note: movement.note,
              lines: movement.lines.map((line) => ({
                sku: line.sku,
                quantity: line.quantity,
                unitCost: line.unitValue,
              })),
            }
          : {
              issueNumber: movement.number,
              requestedBy: movement.contact,
              issuedAtUtc: movement.createdAt,
              note: movement.note,
              lines: movement.lines.map((line) => ({
                sku: line.sku,
                quantity: line.quantity,
                reason: movement.note,
              })),
            },
      ),
    });

    await ensureOk(response);
    await loadInventory();

    const typeText = movement.type === "receipt" ? "Nhập kho" : movement.number.startsWith("PHH-") ? "Hủy hàng" : "Xuất kho";
    const totalQuantity = movement.lines.reduce((total, line) => total + line.quantity, 0);
    addNotification(
      `Lập phiếu ${typeText} thành công`,
      `Phiếu ${typeText} số ${movement.number} đã được tạo bởi ${movement.creator || user?.fullName}. Số dòng: ${movement.lines.length}, tổng số lượng: ${totalQuantity}.`,
      "success"
    );
    addToast(`Lập phiếu ${typeText} số ${movement.number} thành công!`, "success");
  };

  const updateMovement = async (movement: StockMovementDraft) => {
    try {
      const isReceipt = movement.type === "receipt";
      const response = await authorizedFetch(
        `/api/inventory/${isReceipt ? "stock-receipts" : "stock-issues"}/${encodeURIComponent(movement.id)}`,
        {
          method: "PUT",
          body: JSON.stringify(
            isReceipt
              ? {
                  receiptNumber: movement.number,
                  supplierName: movement.contact,
                  receivedAtUtc: movement.createdAt,
                  note: movement.note,
                  lines: movement.lines.map((line) => ({
                    sku: line.sku,
                    quantity: line.quantity,
                    unitCost: line.unitValue,
                  })),
                }
              : {
                  issueNumber: movement.number,
                  requestedBy: movement.contact,
                  issuedAtUtc: movement.createdAt,
                  note: movement.note,
                  lines: movement.lines.map((line) => ({
                    sku: line.sku,
                    quantity: line.quantity,
                    reason: movement.note,
                  })),
                },
          ),
        },
      );

      await ensureOk(response);
      await loadInventory();

      const typeText = movement.type === "receipt" ? "Nhập kho" : movement.number.startsWith("PHH-") ? "Hủy hàng" : "Xuất kho";
      const totalQuantity = movement.lines.reduce((total, line) => total + line.quantity, 0);
      addNotification(
        "Cập nhật phiếu thành công",
        `Phiếu ${typeText} số ${movement.number} đã được cập nhật. Số dòng: ${movement.lines.length}, tổng số lượng: ${totalQuantity}.`,
        "success",
      );
      addToast(`Đã cập nhật phiếu ${typeText} số ${movement.number} thành công!`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Không thể cập nhật phiếu kho", "error");
      throw error;
    }
  };
  const deleteMovement = async (movement: Movement) => {
    try {
      const documentId = movement.documentId ?? movement.id.split(":")[0];
      const response = await authorizedFetch(
        `/api/inventory/${movement.type === "receipt" ? "stock-receipts" : "stock-issues"}/${encodeURIComponent(documentId)}`,
        { method: "DELETE" },
      );

      await ensureOk(response);
      await loadInventory();

      const typeText = movement.type === "receipt" ? "Nhập kho" : movement.number.startsWith("PHH-") ? "Hủy hàng" : "Xuất kho";
      addNotification(
        "Xóa phiếu thành công",
        `Phiếu ${typeText} số ${movement.number} đã bị xóa bởi ${user?.fullName}.`,
        "error"
      );
      addToast(`Đã xóa phiếu ${typeText} số ${movement.number} thành công!`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Không thể xóa phiếu kho", "error");
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}" (SKU: ${product.sku})?`)) {
      return;
    }

    try {
      const response = await authorizedFetch(`/api/inventory/products/${encodeURIComponent(product.sku)}`, {
        method: "DELETE",
      });

      await ensureOk(response);
      setProducts((currentProducts) => currentProducts.filter((p) => p.sku !== product.sku));
      setEditingProduct(null);
      addToast(`Đã xóa sản phẩm ${product.sku} thành công!`, "success");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể xóa sản phẩm. Vui lòng thử lại.");
    }
  };

  const handleEditProduct = (product: Product | null) => {
    setEditingProduct(product);
    if (product) {
      setActiveView("products");
      addToast(`Đang chỉnh sửa sản phẩm ${product.sku}. Vui lòng xem form phía trên!`, "info");
    }
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  if (!user?.accessToken) {
    return (
      <AuthScreen
        authMode={authMode}
        onAuth={handleAuth}
        onModeChange={setAuthMode}
        onThemeToggle={toggleTheme}
        theme={theme}
      />
    );
  }

  return (
    <>
      <AppLayout
        activeView={activeView}
        apiBaseUrl={apiBaseUrl}
        lowStockCount={lowStockProducts.length}
        onLogout={clearSession}
        onThemeToggle={toggleTheme}
        onViewChange={setActiveView}
        theme={theme}
        user={user}
        notifications={notifications}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onClearAllNotifications={clearAllNotifications}
      >
        {activeView === "roles" ? (
          <section className="status-strip" aria-label="Chỉ số phân quyền">
            <MetricCard label="Tài khoản" value={userRoles.length.toString()} tone="green" icon={Users} />
            <MetricCard label="Quản trị viên" value={userRoles.filter((u) => u.roles.includes("Admin")).length.toString()} tone="amber" icon={Shield} />
            <MetricCard label="Nhân viên kho" value={userRoles.filter((u) => u.roles.includes("InventoryStaff")).length.toString()} tone="red" icon={Warehouse} />
            <MetricCard label="Nhóm vai trò" value={roleDefinitions.length.toString()} tone="neutral" icon={Key} />
          </section>
        ) : (
          <section className="status-strip" aria-label="Chỉ số kho">
            <MetricCard label="Tổng SKU" value={products.length.toString()} tone="green" />
            <MetricCard label="Giá trị tồn" value={formatCurrency(inventoryValue)} tone="amber" />
            <MetricCard label="Sắp hết hàng" value={lowStockProducts.length.toString()} tone="red" />
            <MetricCard label="Phiếu kho" value={movements.length.toString()} tone="neutral" />
          </section>
        )}

        {activeView === "overview" && (
          <OverviewPanel
            lowStockProducts={lowStockProducts}
            movements={movements}
            products={products}
            onCreateReceipt={() => setActiveView("receipts")}
            onCreateIssue={() => setActiveView("issues")}
            onUpdateMovement={updateMovement}
            onEditProduct={handleEditProduct}
            onDeleteMovement={deleteMovement}
          />
        )}

        {activeView === "products" && (
          <ProductsPanel
            products={products}
            onSubmit={upsertProduct}
            editingProduct={editingProduct}
            onEdit={handleEditProduct}
            onDelete={deleteProduct}
          />
        )}

        {activeView === "receipts" && (
          <MovementPanel
            products={products}
            title="Lập phiếu nhập kho"
            type="receipt"
            onSubmit={applyMovement}
            onEditProduct={handleEditProduct}
            movements={movements}
            onUpdateMovement={updateMovement}
            creatorName={user.fullName}
            onDeleteMovement={deleteMovement}
          />
        )}

        {activeView === "issues" && (
          <MovementPanel
            products={products}
            title="Lập phiếu xuất kho"
            type="issue"
            onSubmit={applyMovement}
            onEditProduct={handleEditProduct}
            movements={movements}
            onUpdateMovement={updateMovement}
            creatorName={user.fullName}
            onDeleteMovement={deleteMovement}
          />
        )}

        {activeView === "disposals" && (
          <DisposalPanel
            products={products}
            creatorName={user.fullName}
            onSubmit={applyMovement}
            onEditProduct={handleEditProduct}
          />
        )}

        {activeView === "reports" && (
          <ReportsPanel movements={movements} products={products} onUpdateMovement={updateMovement} onDeleteMovement={deleteMovement} />
        )}

        {activeView === "roles" && user.permissions.includes("identity.roles.manage") && (
          <RoleManagementPanel
            roles={roleDefinitions}
            users={userRoles}
            currentUserEmail={user.email}
            onRefresh={() => loadRoleManagement(user.accessToken, user.permissions)}
            onUpdateUserRoles={updateUserRoles}
          />
        )}
      </AppLayout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default App;







