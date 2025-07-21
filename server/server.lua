local Flakey_Inventories = {}
local Inventory_MaxWeights = {
    [1421142] = 1000,
}
local Inventory_GridSizes = {
    [1421142] = { width = 6, height = 12 },
}

RegisterServerEvent("fl_inventory:requestItems")
AddEventHandler("fl_inventory:requestItems", function(secondaryId)
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]

    local secondaryId = secondaryId or 0

    local firstItems = MySQL.query.await("SELECT * FROM flakey_inventory WHERE owner = @owner", {
        ['@owner'] = owner
    })

    Flakey_Inventories[owner] = firstItems or {}

    local secondaryItems = MySQL.query.await("SELECT * FROM flakey_inventory WHERE owner = @owner", {
        ['@owner'] = secondaryId
    })

    if secondaryItems and #secondaryItems > 0 then
        for _, item in ipairs(secondaryItems) do
            table.insert(Flakey_Inventories[owner], item)
        end
    end

    -- Add all item definitions to the items
    for _, item in ipairs(Flakey_Inventories[owner]) do
        local definition = ItemDefinitions[item.item_id]
        if definition then
            item.weight = definition.weight or 0
            item.image = definition.image or "./icons/default.png"
            item.useEvent = definition.useEvent or ""
            item.removeOnUse = definition.removeOnUse or false
            item.weaponName = definition.weaponName or ""
            item.ammoType = definition.ammoType or ""
        end
    end

    TriggerClientEvent("fl_inventory:sendItems", src, Flakey_Inventories[owner])
    TriggerClientEvent("fl_inventory:setSecondaryMaxWeight", src, Inventory_MaxWeights[secondaryId], Inventory_GridSizes[secondaryId])
end)

RegisterServerEvent("fl_inventory:moveItem")
AddEventHandler("fl_inventory:moveItem", function(data)
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]

    local toOwner = owner
    if data.toInventory == 2 then
        toOwner = data.secondaryId
    end

    if data.toInventory ~= data.fromInventory then
        local currentWeight = 0
        local maxWeight = Inventory_MaxWeights[toOwner] or 250
        for _, item in pairs(Flakey_Inventories[owner]) do
            if item.inventoryId == data.toInventory then
                currentWeight = currentWeight + (item.weight)
            end
        end

        local itemWeight = 0

        for _, item in pairs(Flakey_Inventories[owner] or {}) do
            if item.label == data.label and
            item.gridX == data.fromX and
            item.gridY == data.fromY and
            item.inventoryId == data.fromInventory and
            item.width == data.originalWidth and
            item.height == data.originalHeight then
                itemWeight = itemWeight + item.weight
            end
        end

        if currentWeight + itemWeight > maxWeight then
            return
        end
    end

    for _, item in pairs(Flakey_Inventories[owner] or {}) do
        if item.label == data.label and
           item.gridX == data.fromX and
           item.gridY == data.fromY and
           item.inventoryId == data.fromInventory and
           item.width == data.originalWidth and
           item.height == data.originalHeight then

            item.gridX = data.toX
            item.gridY = data.toY
            item.inventoryId = data.toInventory
            item.width = data.width
            item.height = data.height
            item.owner = toOwner
        end
    end

    -- Update DB: move item
    local sql = MySQL.update.await([[
        UPDATE flakey_inventory
        SET owner = @toOwner, gridX = @toX, gridY = @toY, inventoryId = @toInventory, width = @width, height = @height
        WHERE owner = @owner AND label = @label AND width = @originalWidth AND height = @originalHeight
        AND gridX = @fromX AND gridY = @fromY AND inventoryId = @fromInventory
    ]], {
        ['@toOwner'] = toOwner,
        ['@toX'] = data.toX,
        ['@toY'] = data.toY,
        ['@toInventory'] = data.toInventory,
        ['@width'] = data.width,
        ['@height'] = data.height,
        ['@owner'] = data.owner,
        ['@label'] = data.label,
        ['@originalWidth'] = data.originalWidth,
        ['@originalHeight'] = data.originalHeight,
        ['@fromX'] = data.fromX,
        ['@fromY'] = data.fromY,
        ['@fromInventory'] = data.fromInventory,
    })

    if sql then
        TriggerClientEvent("fl_inventory:sendItems", src, Flakey_Inventories[owner] or {})
    end
end)

RegisterServerEvent("fl_inventory:moveItemSplit")
AddEventHandler("fl_inventory:moveItemSplit", function(data)
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]
    local moved = 0
    local moved2 = 0

    local toOwner = owner
    if data.toInventory == 2 then
        toOwner = data.secondaryId
    end

    if data.toInventory ~= data.fromInventory then
        local currentWeight = 0
        local maxWeight = Inventory_MaxWeights[toOwner] or 250
        for _, item in pairs(Flakey_Inventories[owner]) do
            if item.inventoryId == data.toInventory then
                currentWeight = currentWeight + (item.weight)
            end
        end

        local itemWeight = 0

        for _, item in pairs(Flakey_Inventories[owner] or {}) do
            if moved2 >= (data.amount or 1) then break end
            if item.label == data.label and
            item.gridX == data.fromX and
            item.gridY == data.fromY and
            item.inventoryId == data.fromInventory and
            item.width == data.originalWidth and
            item.height == data.originalHeight then
                itemWeight = itemWeight + item.weight
                moved2 = moved2 + 1
            end
        end

        if currentWeight + itemWeight > maxWeight then
            return
        end
    end

    for _, item in pairs(Flakey_Inventories[owner]) do
        if moved >= (data.amount or 1) then break end

        if item.label == data.label and
           item.gridX == data.fromX and
           item.gridY == data.fromY and
           item.inventoryId == data.fromInventory and
           item.width == data.originalWidth and
           item.height == data.originalHeight then

            item.gridX = data.toX
            item.gridY = data.toY
            item.inventoryId = data.toInventory
            item.width = data.width
            item.height = data.height
            item.owner = toOwner

            moved = moved + 1
        end
    end

    -- Update DB: move item
    local sql = MySQL.update.await([[
        UPDATE flakey_inventory
        SET owner = @toOwner, gridX = @toX, gridY = @toY, inventoryId = @toInventory, width = @width, height = @height
        WHERE owner = @owner AND label = @label AND width = @originalWidth AND height = @originalHeight
        AND gridX = @fromX AND gridY = @fromY AND inventoryId = @fromInventory LIMIT @limit
    ]], {
        ['@toOwner'] = toOwner,
        ['@toX'] = data.toX,
        ['@toY'] = data.toY,
        ['@toInventory'] = data.toInventory,
        ['@width'] = data.width,
        ['@height'] = data.height,
        ['@owner'] = data.owner,
        ['@label'] = data.label,
        ['@originalWidth'] = data.originalWidth,
        ['@originalHeight'] = data.originalHeight,
        ['@fromX'] = data.fromX,
        ['@fromY'] = data.fromY,
        ['@fromInventory'] = data.fromInventory,
        ['@limit'] = data.amount or 1,  -- Limit the number of items moved
    })

    if sql then
        TriggerClientEvent("fl_inventory:sendItems", src, Flakey_Inventories[owner] or {})
    end
end)

RegisterServerEvent("fl_inventory:stackItem")
AddEventHandler("fl_inventory:stackItem", function(data)
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]
    local inventory = Flakey_Inventories[owner] or {}

    local toOwner = owner
    if data.toInventory == 2 then
        toOwner = data.secondaryId
    end

        if data.toInventory ~= data.fromInventory then
        local currentWeight = 0
        local maxWeight = Inventory_MaxWeights[toOwner] or 250
        for _, item in pairs(Flakey_Inventories[owner]) do
            if item.inventoryId == data.toInventory then
                currentWeight = currentWeight + (item.weight)
            end
        end

        local itemWeight = 0

        for _, item in pairs(Flakey_Inventories[owner] or {}) do
            if item.label == data.label and
            item.gridX == data.fromX and
            item.gridY == data.fromY and
            item.inventoryId == data.fromInventory and
            item.width == data.originalWidth and
            item.height == data.originalHeight then
                itemWeight = itemWeight + item.weight
            end
        end

        if currentWeight + itemWeight > maxWeight then
            return
        end
    end

    -- Find all matching items in the source stack
    local toStack = {}
    for i = #inventory, 1, -1 do
        local item = inventory[i]
        if item.label == data.label and
           item.gridX == data.fromX and
           item.gridY == data.fromY and
           item.inventoryId == data.fromInventory and
           item.width == data.originalWidth and
           item.height == data.originalHeight then
            table.insert(toStack, item)
            table.remove(inventory, i)
        end
    end

    -- Move stacked items to new cell
    for _, item in ipairs(toStack) do
        item.gridX = data.toX
        item.gridY = data.toY
        item.inventoryId = data.toInventory
        item.width = data.width
        item.height = data.height
        item.owner = toOwner
        table.insert(inventory, item)
    end

    -- Update DB: move all matching items
    local sql = MySQL.update.await([[
        UPDATE flakey_inventory
        SET owner = @toOwner, gridX = @toX, gridY = @toY, inventoryId = @toInventory, width = @width, height = @height
        WHERE owner = @owner AND label = @label AND width = @originalWidth AND height = @originalHeight
        AND gridX = @fromX AND gridY = @fromY AND inventoryId = @fromInventory
    ]], {
        ['@toOwner'] = toOwner,
        ['@toX'] = data.toX,
        ['@toY'] = data.toY,
        ['@toInventory'] = data.toInventory,
        ['@width'] = data.width,
        ['@height'] = data.height,
        ['@owner'] = data.owner,
        ['@label'] = data.label,
        ['@originalWidth'] = data.originalWidth,
        ['@originalHeight'] = data.originalHeight,
        ['@fromX'] = data.fromX,
        ['@fromY'] = data.fromY,
        ['@fromInventory'] = data.fromInventory,
    })

    -- Refresh client with updated inventory
    if sql then
        TriggerClientEvent("fl_inventory:sendItems", src, inventory)
    end
end)

-- TODO LATER!!!!!!!

-- CreateThread(function()
--     while true do
--         local decayDelay = 600000 * 3 -- 30 mins
--         Wait(decayDelay)

--         for owner, inventory in pairs(Flakey_Inventories) do
--             local updated = false

--             -- Iterate backwards to safely remove items while looping
--             for i = #inventory, 1, -1 do
--                 local item = inventory[i]
--                 local def = ItemDefinitions[item.label]
--                 local decayRate = def and def.decayRate or 0

--                 if item.durability and decayRate > 0 then
--                     local newDurability = item.durability - decayRate

--                     if newDurability <= 0 then
--                         -- Delete from DB
--                         MySQL.query.await("DELETE FROM flakey_inventory WHERE id = @id", {
--                             ['@id'] = item.id
--                         })

--                         -- Remove from in-memory table
--                         table.remove(inventory, i)

--                         updated = true
--                     else
--                         item.durability = newDurability

--                         -- Update in DB
--                         MySQL.update.await([[
--                             UPDATE flakey_inventory
--                             SET durability = @durability
--                             WHERE id = @id
--                         ]], {
--                             ['@durability'] = newDurability,
--                             ['@id'] = item.id
--                         })

--                         updated = true
--                     end
--                 end
--             end

--             -- Sync updated inventory to client
--             local src = exports["flakey_core"]:getSourceFromCID(owner)
--             if updated and src then
--                 TriggerClientEvent("fl_inventory:sendItems", src, inventory)
--             end
--         end
--     end
-- end)

-- RegisterServerEvent("fl_inventory:decayItem", function(data)
--     local src = source
--     local owner = exports["flakey_core"]:activeCharacter()[src]
--     local inventory = Flakey_Inventories[owner] or {}

--     for _, item in pairs(inventory) do
--         if item.label == data.label and item.id == data.id then
--             local def = ItemDefinitions[item.label]
--             if def and def.decayRate then
--                 item.durability = math.max(item.durability - def.decayRate, 0)

--                 -- Update DB durability
--                 MySQL.update.await([[
--                     UPDATE flakey_inventory
--                     SET durability = @durability
--                     WHERE id = @id
--                 ]], {
--                     ['@durability'] = item.durability,
--                     ['@id'] = item.id
--                 })

--                 TriggerClientEvent("fl_inventory:sendItems", src, inventory)
--                 break
--             end
--         end
--     end
-- end)

RegisterServerEvent("fl_inventory:useItem")
AddEventHandler("fl_inventory:useItem", function(data)
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]
    local inventory = Flakey_Inventories[owner] or {}
    for _, item in pairs(inventory) do
        if item.label == data.label and item.id == data.id then
            if data.weaponName then
                TriggerClientEvent("fl_inventory:giveWeapon", src, data.weaponName)
            elseif data.ammoType then
                TriggerClientEvent("fl_inventory:addAmmo", src, data.ammoType, 50)
            else
                TriggerClientEvent(data.useEvent, src)
            end
            TriggerClientEvent("fl_inventory:notification", src, item.label, item.item_id, item.image, "Used")
            if data.removeOnUse then
                MySQL.query.await("DELETE FROM flakey_inventory WHERE id = @id", { 
                    ['@id'] = item.id
                })
                TriggerClientEvent("fl_inventory:notification", src, item.label, item.item_id, item.image, "Removed")
            end
            break
        end
    end
end)