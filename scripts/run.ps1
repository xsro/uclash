$LAST_WORKDIR=$(Get-Location)
Set-Location $(Split-Path $PSScriptRoot)
git pull
node . update --git-push -f "$(scoop prefix clash-for-windows)\data\profiles\1642944600269.yml"
Set-Location $LAST_WORKDIR