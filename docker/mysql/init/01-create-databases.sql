CREATE DATABASE IF NOT EXISTS nexus_erp_identity CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS nexus_erp_hr CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS nexus_erp_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

GRANT ALL PRIVILEGES ON nexus_erp_identity.* TO 'nexus'@'%';
GRANT ALL PRIVILEGES ON nexus_erp_hr.* TO 'nexus'@'%';
GRANT ALL PRIVILEGES ON nexus_erp_inventory.* TO 'nexus'@'%';
FLUSH PRIVILEGES;
