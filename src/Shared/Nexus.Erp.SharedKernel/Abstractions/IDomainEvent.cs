namespace Nexus.Erp.SharedKernel.Abstractions;

public interface IDomainEvent
{
    DateTimeOffset OccurredOnUtc { get; }
}
