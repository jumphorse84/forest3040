$lines = Get-Content "src\App.tsx" -Encoding UTF8

# 1. Find and add import after last import line
$importIdx = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "^import.*from") { $importIdx = $i }
}
Write-Host "Last import at line: $($importIdx+1)"
Write-Host "Content: $($lines[$importIdx])"

# 2. Insert import line after last import
$importLine = "import ForestCommunityView from './views/ForestCommunityView';"
$newLines = $lines[0..$importIdx] + @($importLine) + $lines[($importIdx+1)..($lines.Length-1)]

# 3. Replace handleNavigateToMyForestBoard (line 603 -> now 604 after insert)
# Find it again
$handlerIdx = -1
for ($i = 0; $i -lt $newLines.Length; $i++) {
    if ($newLines[$i] -match "handleNavigateToMyForestBoard = \(\)") { $handlerIdx = $i }
}
Write-Host "Handler at line: $($handlerIdx+1)"

# Replace the handler function (5 lines)
$newLines[$handlerIdx] = "  const handleNavigateToMyForestBoard = () => {"
$newLines[$handlerIdx+1] = "    setSubPage('forest_community');"
$newLines[$handlerIdx+2] = "  };"
# Remove the extra lines (old body was 5 lines, new is 3)
$newLines = $newLines[0..($handlerIdx+2)] + $newLines[($handlerIdx+5)..($newLines.Length-1)]

$newLines | Set-Content "src\App.tsx" -Encoding UTF8
Write-Host "Done. Total: $($newLines.Length)"
