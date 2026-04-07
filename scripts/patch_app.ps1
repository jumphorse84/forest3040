$filePath = "src/App.tsx"
$content = Get-Content $filePath -Raw
$oldHandler = "const handleNavigateToMyForestBoard = () => {`r?`n\s*if \(userData && userData.forest_id\) {`r?`n\s*setSelectedForestId\(userData.forest_id\);`r?`n\s*setSubPage\('forest_board'\);`r?`n\s*}`r?`n\s*};"
$newHandler = "const handleNavigateToMyForestBoard = () => {`n    setSubPage('forest_community');`n  };"

# Use regex to replace
$content = [regex]::Replace($content, [regex]::Escape("  const handleNavigateToMyForestBoard = () => {") + "\s*" + [regex]::Escape("if (userData && userData.forest_id) {") + "\s*" + [regex]::Escape("setSelectedForestId(userData.forest_id);") + "\s*" + [regex]::Escape("setSubPage('forest_board');") + "\s*" + [regex]::Escape("}") + "\s*" + [regex]::Escape("};"), $newHandler)

$content | Set-Content $filePath -NoNewline
Write-Host "Success"
