using MediatR;
using Nexus.Erp.SharedKernel.Errors;

namespace Nexus.Erp.Application.Abstractions.Messaging;

public interface ICommand : IRequest<Result>;

public interface ICommand<TResponse> : IRequest<Result<TResponse>>;
