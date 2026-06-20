variable "subscription_id" {
  description = "Azure subscription id. Leave null to use Azure CLI / environment authentication."
  type        = string
  default     = null
}

variable "project_name" {
  description = "Project name used in resource names."
  type        = string
  default     = "teamfit"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]{1,20}$", var.project_name))
    error_message = "project_name must start with a letter and contain only letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name used in resource names."
  type        = string
  default     = "poc"

  validation {
    condition     = can(regex("^[a-zA-Z0-9-]{2,12}$", var.environment))
    error_message = "environment must contain only letters, numbers, and hyphens."
  }
}

variable "location" {
  description = "Azure region for regional resources."
  type        = string
  default     = "westeurope"
}

variable "static_web_app_location" {
  description = "Azure Static Web App region."
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Optional existing/new resource group name. If null, Terraform generates one."
  type        = string
  default     = null
}

variable "tags" {
  description = "Extra tags merged with TeamFit defaults."
  type        = map(string)
  default     = {}
}

variable "vnet_address_space" {
  description = "POC VNet address space."
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "app_integration_subnet_prefix" {
  description = "Subnet prefix for App Service Regional VNet Integration."
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_endpoint_subnet_prefix" {
  description = "Subnet prefix for private endpoints."
  type        = string
  default     = "10.0.2.0/24"
}

variable "app_service_plan_sku" {
  description = "Linux App Service Plan SKU. B1 is minimum low-cost tier for Regional VNet Integration."
  type        = string
  default     = "B1"
}

variable "app_service_worker_count" {
  description = "App Service Plan worker count."
  type        = number
  default     = 1
}

variable "dotnet_version" {
  description = "Linux App Service .NET runtime version."
  type        = string
  default     = "10.0"
}

variable "aspnetcore_environment" {
  description = "ASPNETCORE_ENVIRONMENT value for the API App Service."
  type        = string
  default     = "Production"
}

variable "allowed_cors_origins" {
  description = "Extra allowed CORS origins for the API, e.g. local frontend URLs."
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "api_app_settings" {
  description = "Extra App Service app settings. Values override defaults on key collision."
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "manage_key_vault_secrets" {
  description = "Create Key Vault secrets from Terraform. Requires runner network access to private Key Vault endpoint when public access is disabled."
  type        = bool
  default     = false
}

variable "frontend_api_base_url" {
  description = "Optional VITE_API_BASE_URL for Static Web App builds. Null uses /api only when linked backend is enabled."
  type        = string
  default     = null
}

variable "static_web_app_sku_tier" {
  description = "Static Web App SKU tier. Free for low-cost POC; Standard required for linked backend."
  type        = string
  default     = "Free"

  validation {
    condition     = contains(["Free", "Standard"], var.static_web_app_sku_tier)
    error_message = "static_web_app_sku_tier must be Free or Standard."
  }
}

variable "static_web_app_sku_size" {
  description = "Static Web App SKU size. Use Free with tier Free, Standard with tier Standard."
  type        = string
  default     = "Free"

  validation {
    condition     = contains(["Free", "Standard"], var.static_web_app_sku_size)
    error_message = "static_web_app_sku_size must be Free or Standard."
  }
}

variable "enable_static_web_app_backend_link" {
  description = "Create Static Web App linked backend to App Service. Requires Static Web App Standard."
  type        = bool
  default     = false
}

variable "sql_admin_login" {
  description = "Azure SQL administrator login."
  type        = string
  default     = "teamfitadmin"
}

variable "sql_admin_password" {
  description = "Optional Azure SQL administrator password. Random password generated when null."
  type        = string
  default     = null
  sensitive   = true
}

variable "sql_database_sku_name" {
  description = "Azure SQL Database SKU. Basic is predictable fallback when Free offer is unavailable."
  type        = string
  default     = "Basic"
}

variable "sql_database_max_size_gb" {
  description = "Azure SQL Database max size in GB."
  type        = number
  default     = 2
}

variable "cosmos_consistency_level" {
  description = "Cosmos DB default consistency level."
  type        = string
  default     = "Session"
}

variable "ai_services_kind" {
  description = "Cognitive account kind for Azure AI Foundry / Azure OpenAI. AIServices is Foundry-oriented; OpenAI is classic Azure OpenAI."
  type        = string
  default     = "AIServices"

  validation {
    condition     = contains(["AIServices", "OpenAI"], var.ai_services_kind)
    error_message = "ai_services_kind must be AIServices or OpenAI."
  }
}

variable "enable_ai_rbac_assignment" {
  description = "Assign Cognitive Services OpenAI User role to API managed identity. Disable if tenant lacks role definition for selected kind/region."
  type        = bool
  default     = true
}

variable "log_analytics_daily_quota_gb" {
  description = "Daily ingestion quota for Log Analytics. Set -1 for unlimited."
  type        = number
  default     = 1
}
