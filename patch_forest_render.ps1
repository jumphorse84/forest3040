$lines = Get-Content "src\App.tsx" -Encoding UTF8

# Insert forest_community render block before line 795 (index 794)
$insertIdx = 793  # 0-based (line 794)

$newBlock = @(
    "        {subPage === 'forest_community' && (",
    "          <ForestCommunityView onBack={() => setSubPage(null)} />",
    "        )}"
)

$newLines = $lines[0..($insertIdx-1)] + $newBlock + $lines[$insertIdx..($lines.Length-1)]
$newLines | Set-Content "src\App.tsx" -Encoding UTF8
Write-Host "Done. Total: $($newLines.Length)"

# Verify
Get-Content "src\App.tsx" -Encoding UTF8 | Select-Object -Index (791..800) | ForEach-Object { "$($_.ReadCount): $_" }
