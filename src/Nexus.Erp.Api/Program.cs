using Microsoft.OpenApi.Models;
using Nexus.Erp.Api.Middleware;
using Nexus.Erp.Modules.HR.Application;
using Nexus.Erp.Modules.HR.Infrastructure;
using Nexus.Erp.Modules.HR.Presentation.Employees;
using Nexus.Erp.Modules.Identity.Application;
using Nexus.Erp.Modules.Identity.Infrastructure;
using Nexus.Erp.Modules.Identity.Presentation.Auth;
using Nexus.Erp.Modules.Inventory.Application;
using Nexus.Erp.Modules.Inventory.Infrastructure;
using Nexus.Erp.Modules.Inventory.Presentation.Products;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "Frontend";

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? [];

        if (allowedOrigins.Length == 0)
        {
            allowedOrigins =
            [
                "http://localhost:3000",
                "http://localhost:4200",
                "http://localhost:5173",
                "http://localhost:8080",
                "https://localhost:3000",
                "https://localhost:4200",
                "https://localhost:5173",
                "https://localhost:8080"
            ];
        }

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste JWT access token here."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            []
        }
    });
});

builder.Services
    .AddIdentityApplication()
    .AddHrApplication()
    .AddInventoryApplication();

builder.Services
    .AddIdentityInfrastructure(builder.Configuration)
    .AddHrInfrastructure(builder.Configuration)
    .AddInventoryInfrastructure(builder.Configuration);

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanReadHr", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("permission", "hr.read");
    });

    options.AddPolicy("CanReadInventory", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("permission", "inventory.read");
    });

    options.AddPolicy("CanWriteInventory", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("permission", "inventory.write");
    });
});

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapIdentityEndpoints();
app.MapHrEndpoints();
app.MapInventoryEndpoints();

app.Run();

public partial class Program;

