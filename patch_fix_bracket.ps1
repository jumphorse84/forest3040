$lines = Get-Content "src\App.tsx" -Encoding UTF8
# Insert closing )} after line index 800 (line 801)
$newLines = $lines[0..800] + @("        )}") + $lines[801..($lines.Length-1)]
$newLines | Set-Content "src\App.tsx" -Encoding UTF8
Write-Host "Total lines: $($newLines.Length)"
