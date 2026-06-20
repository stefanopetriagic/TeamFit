terraform {
  backend "azurerm" {
    resource_group_name  = "rg-verde"
    storage_account_name = "tfstateverde"
    container_name       = "tfstate"
    key                  = "teamfit-poc.tfstate"
  }
}
