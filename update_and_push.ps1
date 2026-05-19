$token = "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"
$username = "juanescobarrojas92-art"

# Copiar build compilado a public del backend
robocopy "C:\Users\Admin\.gemini\antigravity\scratch\astillero-frontend\dist" "C:\Users\Admin\.gemini\antigravity\scratch\astillero-stock\public" /MIR

# Hacer commit y push
Set-Location "C:\Users\Admin\.gemini\antigravity\scratch\astillero-stock"
git add .
git commit -m "fix: Excel import now saves to DB + rebuild frontend"
$remoteUrl = "https://${token}@github.com/${username}/astillero-stock.git"
git remote set-url origin $remoteUrl
git push origin main

Write-Output "Listo! Cambios subidos a GitHub."
