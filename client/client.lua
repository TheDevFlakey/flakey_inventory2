RegisterCommand("open:inv", function()
    SetNuiFocus(true, true)
    TriggerServerEvent("fl_inventory:requestItems")
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

RegisterNUICallback("splitItem", function(data, cb)
    TriggerServerEvent("fl_inventory:splitItem", data)
    cb({ success = true })
end)

RegisterKeyMapping("open:inv", "Open Inventory", "keyboard", "F2")