$filePath = "src/App.tsx"
$lines = Get-Content $filePath
$newLines = @()
$skip = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($skip -gt 0) {
        $skip--
        continue
    }
    if ($lines[$i] -match "const handleNavigateToMyForestBoard = \(\) => \{") {
        $newLines += "  const handleNavigateToMyForestBoard = () => {"
        $newLines += "    setSubPage('forest_community');"
        $newLines += "  };"
        $skip = 5 # skip the next 5 lines (606-610)
    } elseif ($lines[$i] -match "subPage === 'forest_board' && <ForestBoardView") {
        $newLines += $lines[$i]
        $newLines += "        {subPage === 'forest_community' && ("
        $newLines += "          <ForestCommunityView onBack={() => setSubPage(null)} />"
        $newLines += "        )}"
    } else {
        $newLines += $lines[$i]
    }
}
$newLines | Set-Content $filePath -Encoding UTF8
Write-Host "Patch applied"
