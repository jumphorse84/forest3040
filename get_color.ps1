Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("public/splash.gif")
$pixel = $bmp.GetPixel(0,0)
$hex = "#{0:X2}{1:X2}{2:X2}" -f $pixel.R, $pixel.G, $pixel.B
Write-Host $hex
