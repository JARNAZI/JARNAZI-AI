$files = @("es.ts", "pt.ts", "de.ts", "it.ts", "ja.ts", "fr.ts", "sv.ts")
$adminCostsStr = "    adminCosts: {
        title: 'AI Cost Rates',
        subtitle: 'Manage per-unit USD rates used by the pricing engine (75% cost / 25% margin).'
    },

"
foreach ($f in $files) {
    $path = "src/i18n/dictionaries/$f"
    if (Test-Path $path) {
        $content = Get-Content -LiteralPath $path -Raw
        if ($content -notlike "*adminCosts:*") {
            if ($content -match "(\s+)adminProviders:") {
                $indent = $matches[1]
                $fragment = "$indent`adminCosts: {`r`n$indent    title: 'AI Cost Rates',`r`n$indent    subtitle: 'Manage per-unit USD rates used by the pricing engine (75% cost / 25% margin).'`r`n$indent},`r`n`r`n"
                $newContent = $content -replace "(\s+)adminProviders:", "$fragment`$1adminProviders:"
                $newContent | Set-Content -LiteralPath $path -Encoding UTF8
            }
        }
    }
}
