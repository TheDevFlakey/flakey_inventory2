RegisterCommand("open:inv", function()
    TriggerEvent("fl_inventory:openInventory", 1421142)
end)

RegisterNetEvent("fl_inventory:openInventory", function(secondaryId)
    SetNuiFocus(true, true)
    TriggerServerEvent("fl_inventory:requestItems", secondaryId or 0)
    SendReactMessage("setSecondaryId", {
        secondaryId = secondaryId
    })
end)

RegisterNetEvent("fl_inventory:sendItems", function(items, maxWeight)
    SendReactMessage("setInventoryVisible", {
        visible = true,
        items = items
    })
end)

RegisterNetEvent("fl_inventory:setSecondaryMaxWeight", function(maxWeight)
    SendReactMessage("setSecondaryMaxWeight", {
        secondaryMaxWeight = maxWeight
    })
end)

RegisterNUICallback("closeInventory", function(data, cb)
    SetNuiFocus(false, false)

    cb({ success = true })
end)

RegisterNUICallback("moveItem", function(data, cb)
    TriggerServerEvent("fl_inventory:moveItem", data)

    cb({ success = true })
end)

RegisterNUICallback("stackItem", function(data, cb)
    TriggerServerEvent("fl_inventory:stackItem", data)
    cb({ success = true })
end)

RegisterNUICallback("moveItemSplit", function(data, cb)
    TriggerServerEvent("fl_inventory:moveItemSplit", data)
    cb({ success = true })
end)

RegisterNUICallback("useItem", function(data, cb)
    SetNuiFocus(false, false)
    TriggerServerEvent("fl_inventory:useItem", data)
    cb({ success = true })
end)

RegisterNetEvent("fl_inventory:notification", function(label, item_id, image, msg)
    SendReactMessage("showNotification", { label = label, item_id = item_id, image = image, msg = msg })
end)

RegisterKeyMapping("open:inv", "Open Inventory", "keyboard", "F2")