using Microsoft.AspNetCore.Diagnostics;
using Nexus.Erp.Api.Errors;
using Nexus.Erp.Application.Abstractions.Exceptions;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Api.Middleware;

internal sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment environment) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var response = CreateErrorResponse(httpContext, exception);

        if (response.Status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception occurred. TraceId: {TraceId}", response.TraceId);
        }
        else
        {
            logger.LogWarning(exception, "Request failed. TraceId: {TraceId}", response.TraceId);
        }

        httpContext.Response.StatusCode = response.Status;
        httpContext.Response.ContentType = "application/json";

        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

        return true;
    }

    private StandardErrorResponse CreateErrorResponse(HttpContext httpContext, Exception exception)
    {
        var traceId = httpContext.TraceIdentifier;
        var path = httpContext.Request.Path.Value ?? string.Empty;

        return exception switch
        {
            ValidationException validationException => new StandardErrorResponse(
                StatusCodes.Status400BadRequest,
                "Validation.Failed",
                validationException.Message,
                traceId,
                path,
                DateTimeOffset.UtcNow,
                validationException.Errors),

            DomainException domainException => new StandardErrorResponse(
                StatusCodes.Status400BadRequest,
                domainException.Error.Code,
                domainException.Error.Description,
                traceId,
                path,
                DateTimeOffset.UtcNow),

            UnauthorizedAccessException => new StandardErrorResponse(
                StatusCodes.Status403Forbidden,
                "Authorization.Forbidden",
                "You do not have permission to access this resource.",
                traceId,
                path,
                DateTimeOffset.UtcNow),

            _ => new StandardErrorResponse(
                StatusCodes.Status500InternalServerError,
                "Server.InternalError",
                environment.IsDevelopment()
                    ? exception.Message
                    : "An unexpected error occurred.",
                traceId,
                path,
                DateTimeOffset.UtcNow)
        };
    }
}
