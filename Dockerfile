FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Nexus.Erp.sln ./
COPY Directory.Build.props ./
COPY src ./src
COPY tests ./tests
RUN dotnet restore Nexus.Erp.sln

RUN dotnet publish src/Nexus.Erp.Api/Nexus.Erp.Api.csproj \
    --configuration Release \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Nexus.Erp.Api.dll"]
