namespace Nexus.Erp.Api.Errors;

public sealed record StandardErrorResponse(
    int Status,
    string Code,
    string Message,
    string TraceId,
    string Path,
    DateTimeOffset TimestampUtc,
    object? Details = null);
