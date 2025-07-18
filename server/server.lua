local Flakey_Inventories = {}

RegisterServerEvent("fl_inventory:requestItems")
AddEventHandler("fl_inventory:requestItems", function()
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]

    local items = MySQL.query.await("SELECT * FROM flakey_inventory WHERE owner = @owner", {
        ['@owner'] = owner
    })

    if not Flakey_Inventories[owner] then
        Flakey_Inventories[owner] = items or {}
    end

    TriggerClientEvent("fl_inventory:sendItems", src, Flakey_Inventories[owner])
end)

RegisterServerEvent("fl_inventory:moveItem")
AddEventHandler("fl_inventory:moveItem", function(data)
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]

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
        end
    end
    

    -- Update DB: move item
    MySQL.update.await([[
        UPDATE flakey_inventory
        SET gridX = @toX, gridY = @toY, inventoryId = @toInventory, width = @width, height = @height
        WHERE owner = @owner AND label = @label AND width = @originalWidth AND height = @originalHeight
        AND gridX = @fromX AND gridY = @fromY AND inventoryId = @fromInventory
    ]], {
        ['@toX'] = data.toX,
        ['@toY'] = data.toY,
        ['@toInventory'] = data.toInventory,
        ['@width'] = data.width,
        ['@height'] = data.height,
        ['@owner'] = owner,
        ['@label'] = data.label,
        ['@originalWidth'] = data.originalWidth,
        ['@originalHeight'] = data.originalHeight,
        ['@fromX'] = data.fromX,
        ['@fromY'] = data.fromY,
        ['@fromInventory'] = data.fromInventory,
    })


    TriggerClientEvent("fl_inventory:sendItems", src, Flakey_Inventories[owner] or {})
end)

RegisterServerEvent("fl_inventory:moveItemSplit")
AddEventHandler("fl_inventory:moveItemSplit", function(data)
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]
    local moved = 0

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

            moved = moved + 1
        end
    end

    -- Update DB: move item
    MySQL.update.await([[
        UPDATE flakey_inventory
        SET gridX = @toX, gridY = @toY, inventoryId = @toInventory, width = @width, height = @height
        WHERE owner = @owner AND label = @label AND width = @originalWidth AND height = @originalHeight
        AND gridX = @fromX AND gridY = @fromY AND inventoryId = @fromInventory LIMIT @limit
    ]], {
        ['@toX'] = data.toX,
        ['@toY'] = data.toY,
        ['@toInventory'] = data.toInventory,
        ['@width'] = data.width,
        ['@height'] = data.height,
        ['@owner'] = owner,
        ['@label'] = data.label,
        ['@originalWidth'] = data.originalWidth,
        ['@originalHeight'] = data.originalHeight,
        ['@fromX'] = data.fromX,
        ['@fromY'] = data.fromY,
        ['@fromInventory'] = data.fromInventory,
        ['@limit'] = data.amount or 1,  -- Limit the number of items moved
    })

    TriggerClientEvent("fl_inventory:sendItems", src, Flakey_Inventories[owner] or {})
end)

RegisterServerEvent("fl_inventory:stackItem")
AddEventHandler("fl_inventory:stackItem", function(data)
    local src = source
    local owner = exports["flakey_core"]:activeCharacter()[src]
    local inventory = Flakey_Inventories[owner] or {}

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
        table.insert(inventory, item)
    end

    -- Update DB: move all matching items
    MySQL.update.await([[
        UPDATE flakey_inventory
        SET gridX = @toX, gridY = @toY, inventoryId = @toInventory, width = @width, height = @height
        WHERE owner = @owner AND label = @label AND width = @originalWidth AND height = @originalHeight
        AND gridX = @fromX AND gridY = @fromY AND inventoryId = @fromInventory
    ]], {
        ['@toX'] = data.toX,
        ['@toY'] = data.toY,
        ['@toInventory'] = data.toInventory,
        ['@width'] = data.width,
        ['@height'] = data.height,
        ['@owner'] = owner,
        ['@label'] = data.label,
        ['@originalWidth'] = data.originalWidth,
        ['@originalHeight'] = data.originalHeight,
        ['@fromX'] = data.fromX,
        ['@fromY'] = data.fromY,
        ['@fromInventory'] = data.fromInventory,
    })

    -- Refresh client with updated inventory
    TriggerClientEvent("fl_inventory:sendItems", src, inventory)
end)
