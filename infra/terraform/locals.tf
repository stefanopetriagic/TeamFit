locals {
  normalized_project     = replace(lower(var.project_name), "/[^a-z0-9-]/", "-")
  normalized_environment = replace(lower(var.environment), "/[^a-z0-9-]/", "-")
  name_prefix            = "${local.normalized_project}-${local.normalized_environment}"
  compact_prefix         = replace(local.name_prefix, "-", "")
  name_suffix            = random_string.suffix.result
  name_base              = "${local.name_prefix}-${local.name_suffix}"

  resource_group_name = coalesce(var.resource_group_name, "rg-verde")

  api_name             = "app-${local.name_base}-api"
  app_service_plan     = "asp-${local.name_base}-linux"
  app_insights_name    = "appi-${local.name_base}"
  cosmos_account_name  = substr("cosmos-${local.name_base}", 0, 44)
  key_vault_name       = substr("kv-${local.name_base}", 0, 24)
  log_analytics_name   = "log-${local.name_base}"
  sql_database_name    = "sqldb-${local.name_base}"
  sql_server_name      = substr("sql-${local.name_base}", 0, 63)
  static_web_app_name  = "stapp-${local.name_base}"
  storage_account_name = substr("st${local.compact_prefix}${local.name_suffix}", 0, 24)
  vnet_name            = "vnet-${local.name_base}"
  ai_account_name      = substr("ai-${local.name_base}", 0, 64)

  private_dns_zones = {
    blob     = "privatelink.blob.core.windows.net"
    cosmos   = "privatelink.documents.azure.com"
    keyvault = "privatelink.vaultcore.azure.net"
    sql      = "privatelink.database.windows.net"
  }

  default_tags = {
    Application = "TeamFit"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Topology    = "POC"
  }

  tags = merge(local.default_tags, var.tags)
}
