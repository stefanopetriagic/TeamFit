terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azapi = {
      source  = "Azure/azapi"
      version = ">= 2.0.0, < 3.0.0"
    }

    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 4.30.0, < 5.0.0"
    }

    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0, < 4.0.0"
    }
  }
}

provider "azapi" {}

provider "azurerm" {
  subscription_id     = var.subscription_id
  storage_use_azuread = true # required when shared_access_key_enabled = false

  features {}
}
