$lines = Get-Content "src\App.tsx" -Encoding UTF8
# Line 797 (index 796) is stray ")}" - remove if it's just ")}"
if ($lines[796].Trim() -eq ')}') {
    $lines = $lines[0..795] + $lines[797..($lines.Length-1)]
    $lines | Set-Content "src\App.tsx" -Encoding UTF8
    Write-Host "Removed stray. Total: $($lines.Length)"
} else {
    Write-Host "Line 797 content: '$($lines[796])'"
}
Get-Content "src\App.tsx" -Encoding UTF8 | Select-Object -Index (792..800) | ForEach-Object { "$($_.ReadCount): $_" }
