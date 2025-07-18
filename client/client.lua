RegisterCommand("open:inv", function()
    SetNuiFocus(true, true)
    TriggerServerEvent("fl_inventory:requestItems", 123456)
end)

RegisterNetEvent("fl_inventory:sendItems", function(items)
    SendReactMessage("setInventoryVisible", {
        visible = true,
        items = items
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

RegisterKeyMapping("open:inv", "Open Inventory", "keyboard", "F2")