Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("public/splash.gif")
$width = $bmp.Width
$height = $bmp.Height

# Get a few pixels along the top edge
$colors = @()
for ($i = 0; $i -lt 10; $i++) {
    $x = [int]($width / 10 * $i)
    $pixel = $bmp.GetPixel($x, 0)
    $colors += "#{0:X2}{1:X2}{2:X2}" -f $pixel.R, $pixel.G, $pixel.B
}

Write-Host "Top edge colors: " ($colors -join ", ")
