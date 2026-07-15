param(
  [string]$ServiceName = "BEEndpointNodeAgent",
  [string]$NodePath = "node",
  [string]$AgentEntry = "endpoint/agent/service.mjs"
)
New-Service -Name $ServiceName -BinaryPathName "$NodePath $AgentEntry" -StartupType Automatic -Description "BE Endpoint Node Agent Phase 1 service skeleton"
