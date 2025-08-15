# InformalBot PowerShell Startup Script
# This script ensures your bot stays running continuously

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           InformalBot Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting bot with auto-restart capability..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the bot" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

$restartCount = 0
$maxRestarts = 100

function Start-Bot {
    param($Attempt)
    
    Write-Host "[$(Get-Date)] Starting bot (Attempt $Attempt/$maxRestarts)..." -ForegroundColor Green
    
    try {
        # Start the bot manager
        $process = Start-Process -FilePath "node" -ArgumentList "bot-manager.js" -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -ne 0) {
            Write-Host "[$(Get-Date)] Bot exited with code $($process.ExitCode)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "[$(Get-Date)] Error starting bot: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main loop
do {
    $restartCount++
    Start-Bot -Attempt $restartCount
    
    if ($restartCount -lt $maxRestarts) {
        Write-Host ""
        Write-Host "[$(Get-Date)] Bot stopped or crashed" -ForegroundColor Yellow
        Write-Host "Restarting in 5 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    } else {
        Write-Host ""
        Write-Host "[$(Get-Date)] Maximum restart attempts reached!" -ForegroundColor Red
        Write-Host "Please check your bot configuration and restart manually." -ForegroundColor Red
        break
    }
} while ($true)

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
