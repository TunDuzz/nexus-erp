namespace Nexus.Erp.Modules.Identity.Application.Auth;

public static class PermissionConstants
{
    public const string HrRead = "hr.read";
    public const string HrWrite = "hr.write";
    public const string InventoryRead = "inventory.read";
    public const string InventoryWrite = "inventory.write";
    public const string IdentityRead = "identity.read";
    public const string IdentityRolesManage = "identity.roles.manage";

    public static readonly string[] All =
    [
        HrRead,
        HrWrite,
        InventoryRead,
        InventoryWrite,
        IdentityRead,
        IdentityRolesManage
    ];

    public static readonly string[] DefaultUserPermissions =
    [
        InventoryRead,
        InventoryWrite
    ];
}
