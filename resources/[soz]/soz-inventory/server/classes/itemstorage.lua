InventoryItemStorage = {}

function InventoryItemStorage:new(options)
    self.__index = self
    local inventoryOptions = {
        type = nil,
        allowedTypes = {},
        inventoryGetContentCallback = nil,
        inventoryPutContentCallback = nil,
    }

    if not options.type then
        error("InventoryItemStorage:new() - type is required")
    end

    if not options.allowedTypes then
        error("InventoryItemStorage:new() - allowedTypes is required")
    end

    for key, value in pairs(options) do
        if key == "allowedTypes" then
            local itemsType = {}
            for _, v in pairs(value) do
                itemsType[v] = true
            end
            value = itemsType
        end

        inventoryOptions[key] = value
    end

    return setmetatable(inventoryOptions, self)
end

function InventoryItemStorage:LoadInventory(id, owner)
    return {}
end

function InventoryItemStorage:SaveInventory(id, owner, inventory)
    --- Keep the inventory in the memory, it's only used by the InventoryContainer class
end

function InventoryItemStorage:SyncInventory(inv)
    local playerInv = Inventory(inv.owner)
    if playerInv.type ~= "player" then
        return
    end
    local storageItem = playerInv.items[inv.slot]
    if not storageItem then
        return
    end
    local itemDef = QBCore.Shared.Items[storageItem.name]

    if not itemDef.storageItemType then
        return
    end

    local prevItemSize = Inventory.GetItemWeight(itemDef, storageItem.metadata, storageItem.amount)
    storageItem.metadata.storageElements = table.deepclone(inv.items)
    local newItemSize = Inventory.GetItemWeight(itemDef, storageItem.metadata, storageItem.amount)

    playerInv.weight = playerInv.weight + newItemSize - prevItemSize

    _G.Container[playerInv.type]:SyncInventory(playerInv)
end

function InventoryItemStorage:ItemIsAllowed(item)
    return self.allowedTypes[item.type or ""] or false
end

function InventoryItemStorage:CanPlayerUseInventory(owner, playerId)
    return true
end

function InventoryItemStorage:CanGetContentInInventory()
    return true
end
function InventoryItemStorage:CanPutContentInInventory()
    return true
end

function InventoryItemStorage:IsDatastore()
    return true
end
