using Microsoft.Extensions.Configuration;

namespace Nexus.Erp.Infrastructure.Shared.Persistence;

public static class DesignTimeConfiguration
{
    public static string GetConnectionString(string name)
    {
        var configuration = Build();

        return configuration.GetConnectionString(name)
            ?? throw new InvalidOperationException($"Connection string '{name}' was not found.");
    }

    private static IConfigurationRoot Build()
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environments.Development;
        var apiProjectPath = FindApiProjectPath();

        return new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: false)
            .AddEnvironmentVariables()
            .Build();
    }

    private static string FindApiProjectPath()
    {
        foreach (var startPath in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            var directory = new DirectoryInfo(startPath);

            while (directory is not null)
            {
                var apiProjectPath = Path.Combine(directory.FullName, "src", "Nexus.Erp.Api");

                if (Directory.Exists(apiProjectPath))
                {
                    return apiProjectPath;
                }

                if (directory.Name == "Nexus.Erp.Api")
                {
                    return directory.FullName;
                }

                directory = directory.Parent;
            }
        }

        throw new DirectoryNotFoundException("Could not locate 'src/Nexus.Erp.Api' for design-time configuration.");
    }

    private static class Environments
    {
        public const string Development = "Development";
    }
}
