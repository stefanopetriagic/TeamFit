resource "azurerm_service_plan" "api" {
  name                = local.app_service_plan
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = var.app_service_plan_sku
  worker_count        = var.app_service_worker_count
  tags                = local.tags
}

resource "azurerm_linux_web_app" "api" {
  name                                           = local.api_name
  location                                       = data.azurerm_resource_group.main.location
  resource_group_name                            = data.azurerm_resource_group.main.name
  service_plan_id                                = azurerm_service_plan.api.id
  ftp_publish_basic_authentication_enabled       = false
  https_only                                     = true
  public_network_access_enabled                  = true
  virtual_network_subnet_id                      = azurerm_subnet.app_integration.id
  webdeploy_publish_basic_authentication_enabled = false
  tags                                           = local.tags

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on              = true
    ftps_state             = "Disabled"
    minimum_tls_version    = "1.2"
    vnet_route_all_enabled = true

    application_stack {
      dotnet_version = var.dotnet_version
    }

    cors {
      allowed_origins     = var.allowed_cors_origins
      support_credentials = false
    }
  }

  app_settings = merge({
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.api.connection_string
    ApplicationInsights__ConnectionString = azurerm_application_insights.api.connection_string
    ASPNETCORE_ENVIRONMENT                = var.aspnetcore_environment
    AzureAI__Endpoint                     = azurerm_cognitive_account.ai.endpoint
    AzureAI__Kind                         = var.ai_services_kind
    KeyVault__Uri                         = azurerm_key_vault.main.vault_uri
    Storage__BlobEndpoint                 = azurerm_storage_account.main.primary_blob_endpoint
    WEBSITE_RUN_FROM_PACKAGE              = "1"
    WEBSITE_VNET_ROUTE_ALL                = "1"
    }, var.manage_key_vault_secrets ? {
    # ConnectionStrings__DefaultConnection = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.sql_connection[0].id})"
  } : {}, var.api_app_settings)
}

resource "azurerm_static_web_app" "frontend" {
  name                = local.static_web_app_name
  location            = var.static_web_app_location
  resource_group_name = data.azurerm_resource_group.main.name
  sku_tier            = var.static_web_app_sku_tier
  sku_size            = var.static_web_app_sku_size
  tags                = local.tags

  app_settings = var.frontend_api_base_url != null || var.enable_static_web_app_backend_link ? {
    VITE_API_BASE_URL = var.frontend_api_base_url != null ? var.frontend_api_base_url : "/api"
  } : {}
}

resource "azapi_resource" "static_web_app_backend_link" {
  count = var.enable_static_web_app_backend_link ? 1 : 0

  type      = "Microsoft.Web/staticSites/linkedBackends@2025-03-01"
  name      = "default"
  parent_id = azurerm_static_web_app.frontend.id

  body = {
    properties = {
      backendResourceId = azurerm_linux_web_app.api.id
      region            = azurerm_linux_web_app.api.location
    }
  }

  lifecycle {
    precondition {
      condition     = var.static_web_app_sku_tier == "Standard" && var.static_web_app_sku_size == "Standard"
      error_message = "Static Web App linked backend requires static_web_app_sku_tier=Standard and static_web_app_sku_size=Standard."
    }
  }
}

resource "azurerm_role_assignment" "api_key_vault_secrets_user" {
  scope                            = azurerm_key_vault.main.id
  role_definition_id               = data.azurerm_role_definition.key_vault_secrets_user.id
  principal_id                     = azurerm_linux_web_app.api.identity[0].principal_id
  skip_service_principal_aad_check = true
}

resource "azurerm_role_assignment" "api_storage_blob_contributor" {
  scope                            = azurerm_storage_account.main.id
  role_definition_id               = data.azurerm_role_definition.storage_blob_data_contributor.id
  principal_id                     = azurerm_linux_web_app.api.identity[0].principal_id
  skip_service_principal_aad_check = true
}

resource "azurerm_role_assignment" "api_cognitive_openai_user" {
  count = var.enable_ai_rbac_assignment ? 1 : 0

  scope                            = azurerm_cognitive_account.ai.id
  role_definition_id               = data.azurerm_role_definition.cognitive_services_openai_user[0].id
  principal_id                     = azurerm_linux_web_app.api.identity[0].principal_id
  skip_service_principal_aad_check = true
}
