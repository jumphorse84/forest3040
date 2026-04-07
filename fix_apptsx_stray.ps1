$lines = Get-Content "src\App.tsx" -Encoding UTF8

# 811 = stray onShowToast - REMOVE (index 811)
# 812 = broken calendar line - REPLACE with correct version
# 813 = broken kids line - will be part of the fix
# 814 = blank

# Build fixed lines block:
# index 811 -> remove (stray line)
# index 812 -> correct calendar line 
# index 813 -> correct kids line
# index 814 -> blank (keep)

$newLines = $lines[0..810] + @(
    "        {!subPage && activeTab === 'calendar' && <CalendarView user={currentUser} schedules={schedules.length > 0 ? schedules : mockDb.schedules} onShowToast={showToast} />}",
    "        {!subPage && activeTab === 'kids' && <KidsView user={currentUser} onShowToast={showToast} />}",
    "      </main>"
) + $lines[815..($lines.Length-1)]

$newLines | Set-Content "src\App.tsx" -Encoding UTF8
Write-Host "Done. Total lines: $($newLines.Length)"

# Verify
$check = Get-Content "src\App.tsx" -Encoding UTF8
Write-Host "--- Lines 808-820 ---"
$check[807..817] | ForEach-Object { "$($_.ReadCount): $_" }
