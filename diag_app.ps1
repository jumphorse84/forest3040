$lines = Get-Content "src\App.tsx" -Encoding UTF8

# Line 812 (index 811) is a stray "onShowToast={showToast}" - remove it
# Line 813 (index 812) has the calendar line mixed up - we need to check and fix it

Write-Host "Line 811: $($lines[811])"
Write-Host "Line 812: $($lines[812])"
Write-Host "Line 813: $($lines[813])"
Write-Host "Line 814: $($lines[814])"
Write-Host "Line 815: $($lines[815])"
