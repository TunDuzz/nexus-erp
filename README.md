# Nexus ERP

Enterprise Resource Planning (ERP) System - Modular Monorepo Architecture.

## 📁 Repository Structure

- **[nexus-erp-BE](./nexus-erp-BE)**: Backend (.NET 8 Web API, Entity Framework Core, MySQL)
- **[nexus-erp-FE](./nexus-erp-FE)**: Frontend (React, Vite, TypeScript, Tailwind CSS)

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd nexus-erp-BE
cp src/Nexus.Erp.Api/appsettings.Development.example.json src/Nexus.Erp.Api/appsettings.Development.json
# Edit connection strings and JWT secrets in appsettings.Development.json
dotnet restore
dotnet run --project src/Nexus.Erp.Api
```

### 2. Frontend Setup

```bash
cd nexus-erp-FE
npm install
npm run dev
```
