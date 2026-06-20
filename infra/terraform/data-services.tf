data "azurerm_role_definition" "key_vault_secrets_officer" {
  count = var.manage_key_vault_secrets ? 1 : 0

  name  = "Key Vault Secrets Officer"
  scope = azurerm_key_vault.main.id
}

data "azurerm_role_definition" "key_vault_secrets_user" {
  name  = "Key Vault Secrets User"
  scope = azurerm_key_vault.main.id
}

data "azurerm_role_definition" "storage_blob_data_contributor" {
  name  = "Storage Blob Data Contributor"
  scope = azurerm_storage_account.main.id
}

data "azurerm_role_definition" "cognitive_services_openai_user" {
  count = var.enable_ai_rbac_assignment ? 1 : 0

  name  = "Cognitive Services OpenAI User"
  scope = azurerm_cognitive_account.ai.id
}

resource "azurerm_key_vault" "main" {
  name                          = local.key_vault_name
  location                      = data.azurerm_resource_group.main.location
  resource_group_name           = data.azurerm_resource_group.main.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  rbac_authorization_enabled    = true
  public_network_access_enabled = false
  purge_protection_enabled      = false
  soft_delete_retention_days    = 7
  tags                          = local.tags
}

# resource "azurerm_mssql_server" "sql" {
#   name                          = local.sql_server_name
#   location                      = data.azurerm_resource_group.main.location
#   resource_group_name           = data.azurerm_resource_group.main.name
#   version                       = "12.0"
#   administrator_login           = var.sql_admin_login
#   administrator_login_password  = local.sql_admin_password
#   minimum_tls_version           = "1.2"
#   public_network_access_enabled = false
#   tags                          = local.tags
# }

# resource "azurerm_mssql_database" "app" {
#   name                 = local.sql_database_name
#   server_id            = azurerm_mssql_server.sql.id
#   sku_name             = var.sql_database_sku_name
#   max_size_gb          = var.sql_database_max_size_gb
#   storage_account_type = "Local"
#   tags                 = local.tags
# }

locals {
  sql_connection_string = "Server=tcp:${azurerm_mssql_server.sql.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.app.name};Persist Security Info=False;User ID=${azurerm_mssql_server.sql.administrator_login};Password=${local.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
}

resource "azurerm_storage_account" "main" {
  name                            = local.storage_account_name
  location                        = data.azurerm_resource_group.main.location
  resource_group_name             = data.azurerm_resource_group.main.name
  account_kind                    = "StorageV2"
  account_replication_type        = "LRS"
  account_tier                    = "Standard"
  access_tier                     = "Hot"
  allow_nested_items_to_be_public = false
  default_to_oauth_authentication = true
  local_user_enabled              = false
  min_tls_version                 = "TLS1_2"
  public_network_access_enabled   = false
  shared_access_key_enabled       = false
  tags                            = local.tags
}

resource "azurerm_storage_account_network_rules" "main" {
  storage_account_id = azurerm_storage_account.main.id
  default_action     = "Deny"
  bypass             = ["AzureServices"]
}

# resource "azurerm_cosmosdb_account" "main" {
#   name                          = local.cosmos_account_name
#   location                      = data.azurerm_resource_group.main.location
#   resource_group_name           = data.azurerm_resource_group.main.name
#   offer_type                    = "Standard"
#   kind                          = "GlobalDocumentDB"
#   public_network_access_enabled = false
#   tags                          = local.tags

#   capabilities {
#     name = "EnableServerless"
#   }

#   consistency_policy {
#     consistency_level = var.cosmos_consistency_level
#   }

#   geo_location {
#     location          = data.azurerm_resource_group.main.location
#     failover_priority = 0
#   }
# }

# resource "azurerm_cosmosdb_sql_database" "ai_agent" {
#   name                = "ai-agent"
#   resource_group_name = data.azurerm_resource_group.main.name
#   account_name        = azurerm_cosmosdb_account.main.name
# }

resource "azurerm_cognitive_account" "ai" {
  name                          = local.ai_account_name
  location                      = data.azurerm_resource_group.main.location
  resource_group_name           = data.azurerm_resource_group.main.name
  kind                          = var.ai_services_kind
  sku_name                      = "S0"
  custom_subdomain_name         = local.ai_account_name
  public_network_access_enabled = true
  local_auth_enabled            = false
  tags                          = local.tags

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_role_assignment" "kv_secrets_officer_deployer" {
  count = var.manage_key_vault_secrets ? 1 : 0

  scope              = azurerm_key_vault.main.id
  role_definition_id = data.azurerm_role_definition.key_vault_secrets_officer[0].id
  principal_id       = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault_secret" "sql_connection" {
  count = var.manage_key_vault_secrets ? 1 : 0

  name         = "sql-default-connection"
  value        = local.sql_connection_string
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.tags

  depends_on = [azurerm_role_assignment.kv_secrets_officer_deployer]
}

resource "azurerm_key_vault_secret" "ai_endpoint" {
  count = var.manage_key_vault_secrets ? 1 : 0

  name         = "ai-services-endpoint"
  value        = azurerm_cognitive_account.ai.endpoint
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.tags

  depends_on = [azurerm_role_assignment.kv_secrets_officer_deployer]
}

resource "azurerm_private_endpoint" "sql" {
  name                = "pe-sql-${local.name_base}"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoint.id
  tags                = local.tags

  private_service_connection {
    name                           = "psc-sql-${local.name_base}"
    private_connection_resource_id = azurerm_mssql_server.sql.id
    is_manual_connection           = false
    subresource_names              = ["sqlServer"]
  }

  private_dns_zone_group {
    name                 = "pdzg-sql"
    private_dns_zone_ids = [azurerm_private_dns_zone.main["sql"].id]
  }
}

# resource "azurerm_private_endpoint" "cosmos" {
#   name                = "pe-cosmos-${local.name_base}"
#   location            = data.azurerm_resource_group.main.location
#   resource_group_name = data.azurerm_resource_group.main.name
#   subnet_id           = azurerm_subnet.private_endpoint.id
#   tags                = local.tags

#   private_service_connection {
#     name                           = "psc-cosmos-${local.name_base}"
#     private_connection_resource_id = azurerm_cosmosdb_account.main.id
#     is_manual_connection           = false
#     subresource_names              = ["Sql"]
#   }

#   private_dns_zone_group {
#     name                 = "pdzg-cosmos"
#     private_dns_zone_ids = [azurerm_private_dns_zone.main["cosmos"].id]
#   }
# }

resource "azurerm_private_endpoint" "storage_blob" {
  name                = "pe-blob-${local.name_base}"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoint.id
  tags                = local.tags

  private_service_connection {
    name                           = "psc-blob-${local.name_base}"
    private_connection_resource_id = azurerm_storage_account.main.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "pdzg-blob"
    private_dns_zone_ids = [azurerm_private_dns_zone.main["blob"].id]
  }
}

resource "azurerm_private_endpoint" "key_vault" {
  name                = "pe-kv-${local.name_base}"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoint.id
  tags                = local.tags

  private_service_connection {
    name                           = "psc-kv-${local.name_base}"
    private_connection_resource_id = azurerm_key_vault.main.id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }

  private_dns_zone_group {
    name                 = "pdzg-kv"
    private_dns_zone_ids = [azurerm_private_dns_zone.main["keyvault"].id]
  }
}
