$lines = Get-Content "src\App.tsx" -Encoding UTF8
# Line 793 (index 792) ends with "/>"
# Line 794 (index 793) starts a new block "{subPage === 'forest_community'"
# We need to insert "        )}" between them
if ($lines[792].Trim() -eq '/>') {
    $newLines = $lines[0..792] + @("        )}") + $lines[793..($lines.Length-1)]
    $newLines | Set-Content "src\App.tsx" -Encoding UTF8
    Write-Host "Inserted. Total: $($newLines.Length)"
    Get-Content "src\App.tsx" -Encoding UTF8 | Select-Object -Index (790..800) | ForEach-Object { "$($_.ReadCount): $_" }
} else {
    Write-Host "Line 793: '$($lines[792])'"
}
