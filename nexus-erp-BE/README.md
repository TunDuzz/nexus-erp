# nexus-erp

Mini ERP built with .NET 8, Clean Architecture and a Modular Monolith layout.

## Modules

- `Identity`: ASP.NET Core Identity, authentication and authorization ownership.
- `HR`: employee and HR bounded context.
- `Inventory`: product and stock bounded context.

Each module is split into:

- `Domain`: entities and domain rules.
- `Application`: CQRS handlers, interfaces and use cases.
- `Infrastructure`: EF Core DbContext and repository implementations.
- `Presentation`: module endpoints.

## MySQL

The project uses MySQL through `Pomelo.EntityFrameworkCore.MySql`.

For stronger module isolation on MySQL, each module has its own database:

- `nexus_erp_identity`
- `nexus_erp_hr`
- `nexus_erp_inventory`

Local connection strings live in:

- `src/Nexus.Erp.Api/appsettings.Development.json`

Change `your_mysql_password` to your local MySQL password before running the API.

Example local setup:

```sql
CREATE DATABASE IF NOT EXISTS nexus_erp_identity CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS nexus_erp_hr CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS nexus_erp_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Apply module migrations:

```bash
dotnet tool restore
dotnet tool run dotnet-ef database update --context NexusIdentityDbContext --project src/Modules/Identity/Nexus.Erp.Modules.Identity.Infrastructure/Nexus.Erp.Modules.Identity.Infrastructure.csproj --startup-project src/Modules/Identity/Nexus.Erp.Modules.Identity.Infrastructure/Nexus.Erp.Modules.Identity.Infrastructure.csproj
dotnet tool run dotnet-ef database update --context HrDbContext --project src/Modules/HR/Nexus.Erp.Modules.HR.Infrastructure/Nexus.Erp.Modules.HR.Infrastructure.csproj --startup-project src/Modules/HR/Nexus.Erp.Modules.HR.Infrastructure/Nexus.Erp.Modules.HR.Infrastructure.csproj
dotnet tool run dotnet-ef database update --context InventoryDbContext --project src/Modules/Inventory/Nexus.Erp.Modules.Inventory.Infrastructure/Nexus.Erp.Modules.Inventory.Infrastructure.csproj --startup-project src/Modules/Inventory/Nexus.Erp.Modules.Inventory.Infrastructure/Nexus.Erp.Modules.Inventory.Infrastructure.csproj
```

## Auth

JWT configuration lives under the `Jwt` section. Keep real local secrets in `appsettings.Development.json`, which is ignored by Git.

Endpoints:

```text
POST /api/identity/register
POST /api/identity/login
GET  /api/identity/me
```

Register request:

```json
{
  "email": "admin@nexus.local",
  "password": "Password123",
  "firstName": "Nexus",
  "lastName": "Admin"
}
```

Use the returned `accessToken` as:

```text
Authorization: Bearer <accessToken>
```

## Inventory

Inventory endpoints require JWT permissions:

- `inventory.read`: read product data.
- `inventory.write`: create/update products and adjust stock.

Endpoints:

```text
GET  /api/inventory/products
GET  /api/inventory/products/{sku}
POST /api/inventory/products
PUT  /api/inventory/products/{sku}
POST /api/inventory/products/{sku}/stock-adjustments
GET  /api/inventory/stock-receipts
GET  /api/inventory/stock-receipts/{receiptId}
POST /api/inventory/stock-receipts
GET  /api/inventory/stock-issues
GET  /api/inventory/stock-issues/{issueId}
POST /api/inventory/stock-issues
```

Create product request:

```json
{
  "sku": "SKU-001",
  "name": "Steel Sheet 2mm",
  "unitOfMeasure": "sheet",
  "unitPrice": 199000,
  "initialQuantity": 0,
  "reorderLevel": 5
}
```

Create stock receipt request:

```json
{
  "receiptNumber": "PN-2026-0001",
  "supplierName": "Acme Materials",
  "receivedAtUtc": null,
  "note": "Initial material purchase",
  "lines": [
    {
      "sku": "SKU-001",
      "quantity": 25,
      "unitCost": 180000
    }
  ]
}
```

Create stock issue request:

```json
{
  "issueNumber": "PX-2026-0001",
  "requestedBy": "Production Team",
  "issuedAtUtc": null,
  "note": "Material issued for production",
  "lines": [
    {
      "sku": "SKU-001",
      "quantity": 2,
      "reason": "Work order WO-001"
    }
  ]
}
```

Stock receipts increase `QuantityOnHand`; stock issues decrease it and fail when stock would become negative.

## Docker

`docker-compose.yml` includes a MySQL 8.4 service and creates the three module databases from:

```text
docker/mysql/init/01-create-databases.sql
```

Run:

```bash
docker compose up --build
```
