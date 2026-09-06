namespace Nexus.Erp.Modules.Identity.Application.Auth;

public static class RoleConstants
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string InventoryStaff = "InventoryStaff";
    public const string HrStaff = "HrStaff";

    public const string DefaultRole = InventoryStaff;

    public static readonly string[] All =
    [
        Admin,
        Manager,
        InventoryStaff,
        HrStaff
    ];

    public static IReadOnlyCollection<string> GetPermissions(string roleName)
    {
        return roleName switch
        {
            Admin => PermissionConstants.All,
            Manager =>
            [
                PermissionConstants.HrRead,
                PermissionConstants.InventoryRead,
                PermissionConstants.InventoryWrite
            ],
            InventoryStaff =>
            [
                PermissionConstants.InventoryRead,
                PermissionConstants.InventoryWrite
            ],
            HrStaff =>
            [
                PermissionConstants.HrRead,
                PermissionConstants.HrWrite
            ],
            _ => []
        };
    }
}
