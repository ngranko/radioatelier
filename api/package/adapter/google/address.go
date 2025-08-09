package google

import (
    "slices"
)

func FindAddressComponent[T AddressComponentProvider](components []T, componentType string) string {
    index := slices.IndexFunc(components, func(item T) bool {
        return slices.Contains(item.GetTypes(), componentType)
    })

    if index == -1 {
        return ""
    }
    return components[index].GetLongName()
}

func ComposeStreetAddress[T AddressComponentProvider](components []T) string {
    streetNumber := FindAddressComponent[T](components, "street_number")
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
