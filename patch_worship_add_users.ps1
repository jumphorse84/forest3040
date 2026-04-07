$lines = Get-Content "src\App.tsx" -Encoding UTF8

# Replace WorshipAddView call to add users prop (line 796-800 = index 795-799)
$lines[796] = "          <WorshipAddView"
$lines[797] = "            onBack={() => setSubPage(null)}"
$lines[798] = "            onShowToast={showToast}"
$lines[799] = "            users={users}"
$lines[800] = "          />"
# $lines[800] = "        )}" stays

$lines | Set-Content "src\App.tsx" -Encoding UTF8
Write-Host "Done"
