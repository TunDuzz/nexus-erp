using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Nexus.Erp.Modules.Identity.Application.Abstractions;
using Nexus.Erp.Modules.Identity.Infrastructure.Authentication;
using Nexus.Erp.Modules.Identity.Infrastructure.Identity;
using Nexus.Erp.Modules.Identity.Infrastructure.Persistence;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace Nexus.Erp.Modules.Identity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("NexusErpIdentity")
            ?? throw new InvalidOperationException("Connection string 'NexusErpIdentity' was not found.");
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 46));
        var jwtOptions = GetJwtOptions(configuration);

        services.AddDbContext<NexusIdentityDbContext>(options =>
            options.UseMySql(
                connectionString,
                serverVersion,
                mySql => mySql.MigrationsHistoryTable("__EFMigrationsHistory")));

        services
            .AddIdentityCore<NexusUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
            })
            .AddRoles<NexusRole>()
            .AddEntityFrameworkStores<NexusIdentityDbContext>();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = ClaimTypes.Name,
                    RoleClaimType = ClaimTypes.Role
                };
            });

        return services;
    }

    private static JwtOptions GetJwtOptions(IConfiguration configuration)
    {
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("JWT configuration section was not found.");

        if (string.IsNullOrWhiteSpace(jwtOptions.Issuer) ||
            string.IsNullOrWhiteSpace(jwtOptions.Audience) ||
            string.IsNullOrWhiteSpace(jwtOptions.Secret))
        {
            throw new InvalidOperationException("JWT Issuer, Audience and Secret must be configured.");
        }

        if (jwtOptions.Secret.Length < 32)
        {
            throw new InvalidOperationException("JWT Secret must contain at least 32 characters.");
        }

        return jwtOptions;
    }
}
