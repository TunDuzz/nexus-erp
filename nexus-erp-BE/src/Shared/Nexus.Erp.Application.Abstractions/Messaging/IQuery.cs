using MediatR;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Application.Abstractions.Messaging;

public interface IQuery<TResponse> : IRequest<Result<TResponse>>;
