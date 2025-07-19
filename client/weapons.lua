-- Weapon categories (for ammo compatibility checks)
local ammoCompatibility = {
    pistol = {
        [`WEAPON_PISTOL`] = true,
        [`WEAPON_COMBATPISTOL`] = true,
        [`WEAPON_APPISTOL`] = true,
        [`WEAPON_PISTOL50`] = true,
        [`WEAPON_SNSPISTOL`] = true,
        [`WEAPON_HEAVYPISTOL`] = true,
        [`WEAPON_VINTAGEPISTOL`] = true,
        [`WEAPON_REVOLVER`] = true
    },
    smg = {
        [`WEAPON_MICROSMG`] = true,
        [`WEAPON_SMG`] = true,
        [`WEAPON_ASSAULTSMG`] = true
    },
    rifle = {
        [`WEAPON_CARBINERIFLE`] = true,
        [`WEAPON_ASSAULTRIFLE`] = true,
        [`WEAPON_ADVANCEDRIFLE`] = true
    }
}

-- Set or update ammo for a weapon
local function setWeaponAmmoState(weaponHash, amount)
    local state = LocalPlayer.state.customAmmo or {}
    state[weaponHash] = amount
    LocalPlayer.state:set("customAmmo", state, true)
end

-- Get ammo for a weapon
local function getWeaponAmmoState(weaponHash)
    local state = LocalPlayer.state.customAmmo or {}
    return state[weaponHash] or 0
end

-- Add ammo to current weapon
RegisterNetEvent("fl_inventory:addAmmo")
AddEventHandler("fl_inventory:addAmmo", function(ammoType, amount)
    print("Adding ammo:", ammoType, "Amount:", amount)
    local ped = PlayerPedId()
    local currentWeapon = GetSelectedPedWeapon(ped)

    if currentWeapon == `WEAPON_UNARMED` then
        print("No weapon equipped.")
        TriggerEvent("fl_inventory:notification", "No Weapon", 0, "Equip a weapon first.")
        return
    end

    local allowed = ammoCompatibility[ammoType] and ammoCompatibility[ammoType][currentWeapon]
    if not allowed then
        print("Incompatible ammo type for current weapon.")
        TriggerEvent("fl_inventory:notification", "Wrong Ammo", 0, "This ammo doesn't fit your weapon.")
        return
    end

    local currentAmmo = getWeaponAmmoState(currentWeapon)
    local newAmmo = currentAmmo + amount

    SetPedAmmo(ped, currentWeapon, newAmmo)
    setWeaponAmmoState(currentWeapon, newAmmo)

    RequestAnimDict("reload@pistol")
    while not HasAnimDictLoaded("reload@pistol") do Wait(10) end
    TaskPlayAnim(ped, "reload@pistol", "reload", 8.0, -8.0, 1000, 48, 0, false, false, false)

    TriggerEvent("fl_inventory:notification", GetLabelText(GetWeaponNameFromHash(currentWeapon)), currentWeapon, ("Loaded %s ammo"):format(amount))
end)

-- Weapon give/holster/unholster logic
RegisterNetEvent("fl_inventory:giveWeapon")
AddEventHandler("fl_inventory:giveWeapon", function(weapon)
    local ped = PlayerPedId()
    local hash = GetHashKey(weapon)
    local currentWeapon = GetSelectedPedWeapon(ped)

    local function loadAnimDict(dict)
        while not HasAnimDictLoaded(dict) do
            RequestAnimDict(dict)
            Wait(10)
        end
    end

    local animDict = "reaction@intimidation@1h"
    local holsterAnim = "outro"
    local unholsterAnim = "intro"

    if currentWeapon == hash then
        -- Save ammo before holstering
        local ammoCount = GetAmmoInPedWeapon(ped, currentWeapon)
        setWeaponAmmoState(currentWeapon, ammoCount)

        -- Holster if already holding
        loadAnimDict(animDict)
        TaskPlayAnim(ped, animDict, holsterAnim, 8.0, -8.0, 1000, 48, 0, false, false, false)
        Wait(800)
        SetCurrentPedWeapon(ped, `WEAPON_UNARMED`, true)
        ClearPedTasks(ped)
        RemoveAllPedWeapons(ped)
    else
        -- Save ammo from old weapon before switching
        if currentWeapon ~= `WEAPON_UNARMED` then
            local ammoCount = GetAmmoInPedWeapon(ped, currentWeapon)
            setWeaponAmmoState(currentWeapon, ammoCount)

            loadAnimDict(animDict)
            TaskPlayAnim(ped, animDict, holsterAnim, 8.0, -8.0, 1000, 48, 0, false, false, false)
            Wait(800)
        end

        GiveWeaponToPed(ped, hash, math.ceil(getWeaponAmmoState(hash)), 0, true)
        SetCurrentPedWeapon(ped, hash, true)

        -- Unholster animation
        loadAnimDict(animDict)
        TaskPlayAnim(ped, animDict, unholsterAnim, 8.0, -8.0, 1000, 48, 0, false, false, false)
        Wait(800)
        SetCurrentPedWeapon(ped, hash, true)
        ClearPedTasks(ped)
    end
end)

CreateThread(function()
    while true do
        Wait(0)
        local ped = PlayerPedId()
        local weapon = GetSelectedPedWeapon(ped)
        if weapon ~= `WEAPON_UNARMED` then
            local ammo = GetAmmoInPedWeapon(ped, weapon)
            if ammo <= 1 then
                DisableControlAction(0, 24, true) -- Attack
                DisableControlAction(0, 257, true) -- Attack2
                DisableControlAction(0, 140, true) -- Melee light
                DisableControlAction(0, 141, true) -- Melee heavy
                DisableControlAction(0, 142, true) -- Melee alternate
            end
        end
    end
end)