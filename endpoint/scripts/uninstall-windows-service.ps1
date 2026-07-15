param([string]$ServiceName = "BEEndpointNodeAgent")
Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
sc.exe delete $ServiceName
