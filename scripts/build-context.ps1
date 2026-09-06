<#
.SYNOPSIS
    Packages the Docker build context (Dockerfile + only the files it actually needs) into a
    plain .tar for a server-side build, with no local Docker install required on this machine.
    Works with any tool that accepts a tar build context: Portainer (Images > Build a new image
    > Upload), plain Docker (`docker build - < file.tar`), or the Docker Engine API's /build
    endpoint directly. Never includes node_modules, dist, .env, or any dev-only file (docs,
    scripts, the OpenAPI export).
#>

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filename = "uptime-kuma-api-bridge-${timestamp}.tar"

# Mirrors exactly what Dockerfile's COPY instructions need, nothing more.
$filesToInclude = @(
    "Dockerfile"
    "src"
    "package.json"
    "pnpm-lock.yaml"
    "pnpm-workspace.yaml"
    "tsconfig.json"
    "tsdown.config.ts"
    "ecosystem.config.cjs"
)

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $projectRoot
try {
    foreach ($path in $filesToInclude) {
        if (-not (Test-Path -Path $path)) {
            throw "Expected file/folder not found: ${path}"
        }
    }

    if (-not (Test-Path -Path "export" -PathType Container)) {
        New-Item -Path "export" -ItemType Directory | Out-Null
    }

    $tarPath = "./export/${filename}"
    if (Test-Path -Path $tarPath -PathType Leaf) {
        Remove-Item -Path $tarPath -Force
        Write-Host "Removed existing ${filename}"
    }

    tar -cvf $tarPath $filesToInclude

    Write-Host "Build context created: $tarPath" -ForegroundColor Green
    Write-Host "Upload it in Portainer (Images > Build a new image > Upload)," -ForegroundColor Green
    Write-Host "or build it directly with: docker build -t uptime-kuma-api-bridge - < $tarPath" -ForegroundColor Green
}
finally {
    Pop-Location
}
