$token = "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"

# Primero obtenemos el username
$user = Invoke-RestMethod -Uri "https://api.github.com/user" `
    -Headers @{
        Authorization = "token $token"
        "User-Agent" = "PowerShell"
        Accept = "application/vnd.github.v3+json"
    }

$username = $user.login
Write-Output "Usuario GitHub: $username"

# Configurar remote con token embebido
$remoteUrl = "https://${token}@github.com/${username}/astillero-stock.git"

git remote remove origin 2>$null
git remote add origin $remoteUrl
git branch -M main
git push -u origin main --force

Write-Output "Push completado a: https://github.com/$username/astillero-stock"
