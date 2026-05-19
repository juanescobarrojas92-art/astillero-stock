$token = "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"
$body = @{
    name = "astillero-stock"
    description = "Sistema de inventario Astillero de Calbuco"
    private = $false
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" `
    -Method Post `
    -Headers @{
        Authorization = "token $token"
        "User-Agent" = "PowerShell"
        Accept = "application/vnd.github.v3+json"
    } `
    -ContentType "application/json" `
    -Body $body

Write-Output "Repo creado: $($response.html_url)"
Write-Output "Clone URL: $($response.clone_url)"
