local eventPrefix = '__PolyZone__:'

function triggerZoneEvent(eventName, ...)
  TriggerLatentClientEvent(eventPrefix .. eventName, -1, 16 * 1024, ...)
end

RegisterNetEvent("PolyZone:TriggerZoneEvent")
AddEventHandler("PolyZone:TriggerZoneEvent", triggerZoneEvent)

exports("TriggerZoneEvent", triggerZoneEvent)
