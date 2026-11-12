"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import * as topojson from "topojson-client"

const MAP_URL = "/maps/india-topo.json"

export function IndiaMapPreview() {
  const router = useRouter()
  const [geoData, setGeoData] = useState<unknown>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(MAP_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Map unavailable")
        return response.json()
      })
      .then((topology) => {
        const states = topology?.objects?.states
        if (states) setGeoData(topojson.feature(topology, states))
      })
      .catch(() => setGeoData(null))

    return () => controller.abort()
  }, [])

  if (!geoData) {
    return <div className="flex h-full min-h-64 items-center justify-center text-sm text-[#4B5563]">Map preview is unavailable</div>
  }

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ scale: 820, center: [82.5, 22.5] }}
      viewBox="0 0 560 430"
      className="h-full max-h-[360px] w-full"
      aria-label="Map of India, select a state to explore"
    >
      <Geographies geography={geoData}>
        {({ geographies }) => geographies.map((geography) => {
          const stateName = geography.properties?.st_nm as string | undefined
          if (!stateName) return null
          const slug = stateName.toLowerCase().replace(/\s+/g, "-")

          return (
            <Geography
              key={geography.rsmKey}
              geography={geography}
              aria-label={`Explore ${stateName}`}
              onClick={() => router.push(`/state/${slug}`)}
              style={{
                default: { fill: "#ffffff", stroke: "#b8b0a0", strokeWidth: 0.9, outline: "none" },
                hover: { fill: "#FACC15", stroke: "#EAB308", strokeWidth: 1.5, outline: "none", cursor: "pointer" },
                pressed: { fill: "#CA8A04", stroke: "#EAB308", strokeWidth: 1.5, outline: "none" },
              }}
            />
          )
        })}
      </Geographies>
    </ComposableMap>
  )
}
