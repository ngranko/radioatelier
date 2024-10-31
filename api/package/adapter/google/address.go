package google

import (
    "slices"
)

func FindAddressComponent(components []AddressComponent, componentType string) string {
    index := slices.IndexFunc(components, func(item AddressComponent) bool {
        return slices.Contains(item.Types, componentType)
    })

    if index == -1 {
        return ""
    }
    return components[index].LongName
}

func ComposeStreetAddress(components []AddressComponent) string {
    streetNumber := FindAddressComponent(components, "street_number")
    route := FindAddressComponent(components, "route")

    if len(streetNumber) == 0 {
        return route
    }

    if len(route) == 0 {
        return streetNumber
    }

    if slices.Contains([]string{"Россия", "Беларусь", "Украина", "Казахстан"}, FindAddressComponent(components, "country")) {
        return route + ", " + streetNumber
    }

    return streetNumber + " " + route
}
