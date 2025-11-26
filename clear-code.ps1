# Clear Code Script - Empties all code files while preserving structure
# Run this from the project root: .\clear-code.ps1

Write-Host "🧹 Clearing all code files (preserving file structure)..." -ForegroundColor Cyan

# Directories to clear
$directories = @(
    "services\backend\src",
    "services\backend\tests",
    "services\frontend\src",
    "services\frontend\tests",
    "services\ml-service\app",
    "services\ml-service\tests",
    "packages\types\src",
    "packages\constants\src",
    "packages\utils\src"
)

# File extensions to clear
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.py")

# Files to SKIP (keep these)
$skipFiles = @(
    "package.json",
    "tsconfig.json",
    "jest.config.js",
    "vite.config.ts",
    "vitest.config.ts",
    "pytest.ini",
    "__init__.py"  # Python package markers
)

$totalCleared = 0
$skipped = 0

foreach ($dir in $directories) {
    $fullPath = Join-Path $PSScriptRoot $dir
    
    if (Test-Path $fullPath) {
        Write-Host "`nProcessing $dir..." -ForegroundColor Yellow
        
        foreach ($ext in $extensions) {
            $files = Get-ChildItem -Path $fullPath -Filter $ext -Recurse -File
            
            foreach ($file in $files) {
                # Check if file should be skipped
                $shouldSkip = $false
                foreach ($skipPattern in $skipFiles) {
                    if ($file.Name -like $skipPattern) {
                        $shouldSkip = $true
                        break
                    }
                }
                
                # Skip __init__.py but only if it's empty or very small
                if ($file.Name -eq "__init__.py") {
                    if ($file.Length -lt 50) {
                        $shouldSkip = $true
                    }
                }
                
                if ($shouldSkip) {
                    Write-Host "  ⏭️  Skipped: $($file.Name)" -ForegroundColor Gray
                    $skipped++
                } else {
                    # Clear file content (write empty string)
                    Set-Content -Path $file.FullName -Value "" -NoNewline
                    Write-Host "  ✅ Cleared: $($file.FullName.Replace($PSScriptRoot, '.'))" -ForegroundColor Green
                    $totalCleared++
                }
            }
        }
    } else {
        Write-Host "  ⚠️  Directory not found: $fullPath" -ForegroundColor Red
    }
}

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Code clearing complete!" -ForegroundColor Green
Write-Host "   📄 Files cleared: $totalCleared" -ForegroundColor White
Write-Host "   ⏭️  Files skipped: $skipped" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n✅ File structure preserved. Ready to start fresh!" -ForegroundColor Green
