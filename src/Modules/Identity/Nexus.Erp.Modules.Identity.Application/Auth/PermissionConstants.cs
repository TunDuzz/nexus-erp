namespace Nexus.Erp.Modules.Identity.Application.Auth;

public static class PermissionConstants
{
    public const string HrRead = "hr.read";
    public const string HrWrite = "hr.write";
    public const string InventoryRead = "inventory.read";
    public const string InventoryWrite = "inventory.write";

    public static readonly string[] DefaultUserPermissions =
    [
        HrRead,
        InventoryRead
    ];
}
