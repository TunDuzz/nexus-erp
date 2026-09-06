export type Theme = "light" | "dark";
export type AuthMode = "login" | "register";
export type View = "overview" | "products" | "receipts" | "issues" | "disposals" | "reports" | "roles";
export type MovementType = "receipt" | "issue";

export type Product = {
  id: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
  unitPrice: number;
  quantityOnHand: number;
  reorderLevel: number;
  manufacturingDate?: string | null;
  expirationDate?: string | null;
};

export type Movement = {
  id: string;
  documentId?: string;
  lineId?: string;
  type: MovementType;
  number: string;
  contact: string;
  sku: string;
  quantity: number;
  value: number;
  note: string;
  createdAt: string;
  creator?: string;
};

export type StockMovementLineDraft = {
  id: string;
  sku: string;
  quantity: number;
  unitValue: number;
};

export type StockMovementDraft = {
  id: string;
  type: MovementType;
  number: string;
  contact: string;
  note: string;
  createdAt: string;
  creator?: string;
  lines: StockMovementLineDraft[];
};

export type UserSession = {
  fullName: string;
  email: string;
  accessToken: string;
  roles: string[];
  permissions: string[];
};

export type RoleDefinition = {
  name: string;
  permissions: string[];
};

export type UserRole = {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};

export type AuthPayload = {
  mode: AuthMode;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
};
