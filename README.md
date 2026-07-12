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

## Docker

`docker-compose.yml` includes a MySQL 8.4 service and creates the three module databases from:

```text
docker/mysql/init/01-create-databases.sql
```

Run:

```bash
docker compose up --build
```
