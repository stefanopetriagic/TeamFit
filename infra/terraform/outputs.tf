output "resource_group_name" {
  description = "Resource group name."
  value       = data.azurerm_resource_group.main.name
}

output "api_app_name" {
  description = "API App Service name."
  value       = azurerm_linux_web_app.api.name
}

output "api_url" {
  description = "Public API App Service URL."
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "static_web_app_url" {
  description = "Static Web App public URL."
  value       = "https://${azurerm_static_web_app.frontend.default_host_name}"
}

output "static_web_app_api_key" {
  description = "Static Web App deployment/publish token."
  value       = azurerm_static_web_app.frontend.api_key
  sensitive   = true
}

output "static_web_app_backend_link_enabled" {
  description = "Whether Terraform creates SWA linked backend."
  value       = var.enable_static_web_app_backend_link
}

output "sql_server_fqdn" {
  description = "Azure SQL Server FQDN, resolved privately from the VNet."
  value       = azurerm_mssql_server.sql.fully_qualified_domain_name
}

output "sql_database_name" {
  description = "Azure SQL Database name."
  value       = azurerm_mssql_database.app.name
}

output "key_vault_uri" {
  description = "Key Vault URI."
  value       = azurerm_key_vault.main.vault_uri
}

output "storage_blob_endpoint" {
  description = "Storage blob endpoint, resolved privately from the VNet."
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

# output "cosmos_endpoint" {
#   description = "Cosmos DB endpoint, resolved privately from the VNet."
#   value       = azurerm_cosmosdb_account.main.endpoint
# }

output "ai_services_endpoint" {
  description = "Azure AI Services / Azure OpenAI public endpoint."
  value       = azurerm_cognitive_account.ai.endpoint
}

output "application_insights_connection_string" {
  description = "Application Insights connection string."
  value       = azurerm_application_insights.api.connection_string
  sensitive   = true
}
