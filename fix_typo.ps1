$files = @("es.ts", "pt.ts", "de.ts", "it.ts", "ja.ts", "fr.ts", "sv.ts")
foreach ($f in $files) {
    $path = "src/i18n/dictionaries/$f"
    if (Test-Path $path) {
        $content = Get-Content -LiteralPath $path -Raw
        $newContent = $content -replace "dminCosts:", "adminCosts:"
        $newContent | Set-Content -LiteralPath $path -Encoding UTF8
    }
}
