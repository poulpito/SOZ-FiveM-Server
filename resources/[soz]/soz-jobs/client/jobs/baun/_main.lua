QBCore = exports["qb-core"]:GetCoreObject()

BaunJob = {}
BaunJob.Functions = {}
BaunJob.MenuState = {}
BaunJob.Menu = MenuV:CreateMenu(nil, "", "menu_job_baun", "soz", "baun:menu")

BaunJob.Harvest = {}
BaunJob.CraftZones = {}

AddEventHandler("onClientResourceStart", function(resourceName)
    for _, config in pairs(BaunConfig.Blips) do
        QBCore.Functions.CreateBlip(config.Id, {
            name = config.Name,
            coords = config.Coords,
            sprite = config.Icon,
            scale = config.Scale,
        })
    end

    BaunJob.Functions.InitHarvestingZones()
end)

AddEventHandler("onClientResourceStop", function(resourceName)
    BaunJob.Functions.DestroyHarvestingZones()
end)

RegisterNetEvent("soz-jobs:client:baun:createCocktailBox", function()
    QBCore.Functions.TriggerCallback("soz-jobs:server:baun:createCocktailBox", function()
    end)
end)
