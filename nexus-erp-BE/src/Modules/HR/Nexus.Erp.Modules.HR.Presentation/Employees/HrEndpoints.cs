using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Nexus.Erp.Modules.HR.Application.Employees.GetEmployeeById;

namespace Nexus.Erp.Modules.HR.Presentation.Employees;

public static class HrEndpoints
{
    public static IEndpointRouteBuilder MapHrEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/hr")
            .WithTags("HR")
            .RequireAuthorization("CanReadHr");

        group.MapGet("/employees/{employeeId:guid}", GetEmployeeByIdAsync)
            .WithName("HR.GetEmployeeById");

        return app;
    }

    private static async Task<IResult> GetEmployeeByIdAsync(
        Guid employeeId,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetEmployeeByIdQuery(employeeId), cancellationToken);

        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(new { result.Error.Code, result.Error.Description });
    }
}
