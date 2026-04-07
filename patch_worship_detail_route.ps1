$bytes = [System.IO.File]::ReadAllBytes("src\App.tsx")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

$old = @"
        {subPage === 'worship_detail' && (
          <WorshipDetailView
            worshipId={selectedWorshipId}
            worships={worships}
            onBack={() => setSubPage(null)}
          />
        )}
"@

$new = @"
        {subPage === 'worship_detail' && (
          <WorshipDetailView
            user={currentUser}
            worshipId={selectedWorshipId}
            worships={worships}
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
          />
        )}
"@

if ($text.Contains($old.Trim())) {
    $result = $text.Replace($old.Trim(), $new.Trim())
    [System.IO.File]::WriteAllBytes("src\App.tsx", [System.Text.Encoding]::UTF8.GetBytes($result))
    Write-Host "SUCCESS"
} else {
    # Try with CRLF
    $oldCRLF = $old.Replace("`n", "`r`n")
    if ($text.Contains($oldCRLF.Trim())) {
        $result = $text.Replace($oldCRLF.Trim(), $new.Trim())
        [System.IO.File]::WriteAllBytes("src\App.tsx", [System.Text.Encoding]::UTF8.GetBytes($result))
        Write-Host "SUCCESS with CRLF"
    } else {
        Write-Host "NOT FOUND - dumping context:"
        $idx = $text.IndexOf("WorshipDetailView`r`n")
        if ($idx -ge 0) { Write-Host $text.Substring($idx-5, 200) }
    }
}
