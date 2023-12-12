BaunConfig = {}

BaunConfig.Restock = {
    ["liquor_crate"] = {
        {itemId = "vodka", quantity = 2},
        {itemId = "gin", quantity = 2},
        {itemId = "tequila", quantity = 2},
        {itemId = "whisky", quantity = 2},
        {itemId = "cognac", quantity = 2},
        {itemId = "rhum", quantity = 2},
    },
    ["flavor_crate"] = {
        {itemId = "green_lemon", quantity = 5},
        {itemId = "cane_sugar", quantity = 10},
        {itemId = "ananas_juice", quantity = 5},
        {itemId = "coconut_milk", quantity = 5},
        -- {itemId = "cinnamon", quantity = 6},
        {itemId = "strawberry_juice", quantity = 5},
        {itemId = "orange_juice", quantity = 5},
        {itemId = "apple_juice", quantity = 5},
    },
    ["furniture_crate"] = {
        {itemId = "straw", quantity = 10},
        {itemId = "fruit_slice", quantity = 12},
        {itemId = "tumbler", quantity = 10},
    },
    ["snack_crate"] = {
        {itemId = "tapas", quantity = 10},
        {itemId = "peanuts", quantity = 10},
        {itemId = "olives", quantity = 10},
    },
}

BaunConfig.CraftZones = {
    {
        center = vector3(130.19, -1280.92, 29.27),
        length = 0.2,
        width = 0.2,
        options = {name = "baun:unicorn:craft:1", heading = 25, minZ = 29.27, maxZ = 29.67},
    },
    {
        center = vector3(-1392.21, -606.3, 30.32),
        length = 0.2,
        width = 0.2,
        options = {name = "baun:bahama:craft:1", heading = 0, minZ = 30.37, maxZ = 30.77},
    },
    {
        center = vector3(-1377.96, -628.86, 30.82),
        length = 0.2,
        width = 0.2,
        options = {name = "baun:bahama:craft:2", heading = 0, minZ = 30.82, maxZ = 31.22},
    },
}

BaunConfig.Recipes = {
    narito = {
        {itemId = "rhum", quantity = 1},
        {itemId = "cane_sugar", quantity = 2},
        {itemId = "green_lemon", quantity = 2},
        {itemId = "fruit_slice", quantity = 4},
        {itemId = "ice_cube", quantity = 8},
        {itemId = "straw", quantity = 1},
        {itemId = "tumbler", quantity = 1},
    },
    lapicolada = {
        {itemId = "rhum", quantity = 1},
        {itemId = "coconut_milk", quantity = 3},
        {itemId = "ananas_juice", quantity = 2},
        {itemId = "fruit_slice", quantity = 4},
        {itemId = "ice_cube", quantity = 6},
        {itemId = "straw", quantity = 1},
        {itemId = "tumbler", quantity = 1},
    },
    sunrayou = {
        {itemId = "tequila", quantity = 1},
        {itemId = "orange_juice", quantity = 1},
        {itemId = "strawberry_juice", quantity = 1},
        {itemId = "fruit_slice", quantity = 4},
        {itemId = "cane_sugar", quantity = 2},
        {itemId = "ice_cube", quantity = 6},
        {itemId = "straw", quantity = 1},
        {itemId = "tumbler", quantity = 1},
    },
    ponche = {
        {itemId = "rhum", quantity = 1},
        {itemId = "orange_juice", quantity = 1},
        {itemId = "ananas_juice", quantity = 1},
        {itemId = "cane_sugar", quantity = 2},
        {itemId = "ice_cube", quantity = 4},
        {itemId = "straw", quantity = 1},
        {itemId = "tumbler", quantity = 1},
    },
    pinkenny = {
        {itemId = "vodka", quantity = 1},
        {itemId = "green_lemon", quantity = 1},
        {itemId = "strawberry_juice", quantity = 2},
        {itemId = "apple_juice", quantity = 3},
        {itemId = "cane_sugar", quantity = 2},
        {itemId = "ice_cube", quantity = 4},
        {itemId = "straw", quantity = 1},
        {itemId = "tumbler", quantity = 1},
    },
    phasmopolitan = {
        {itemId = "gin", quantity = 1},
        {itemId = "green_lemon", quantity = 1},
        {itemId = "ice_cube", quantity = 4},
        {itemId = "straw", quantity = 1},
        {itemId = "tumbler", quantity = 1},
    },
    escalier = {
        {itemId = "cognac", quantity = 1},
        {itemId = "orange_juice", quantity = 2},
        {itemId = "ice_cube", quantity = 2},
        {itemId = "straw", quantity = 1},
        {itemId = "tumbler", quantity = 1},
    },
    whicanelle = {
        {itemId = "whisky", quantity = 1},
        {itemId = "apple_juice", quantity = 2},
        {itemId = "green_lemon", quantity = 1},
        {itemId = "cane_sugar", quantity = 2},
        {itemId = "ice_cube", quantity = 1},
        {itemId = "straw", quantity = 1},
        {itemId = "tumbler", quantity = 1},
    },
}

BaunConfig.Durations = {
    Crafting = 4000, -- in ms
    Restocking = 4000, -- in ms
    Harvesting = 2000, -- in ms
}
