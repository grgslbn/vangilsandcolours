export type Palette = {
  id: string
  name: string
  description: string
  colors: string[]
}

// Color palettes extracted from the Provincie Oost-Vlaanderen huisstijlhandboek.
export const BRAND_PALETTES: Palette[] = [
  {
    id: "primair",
    name: "Primaire kleuren",
    description: "Oranje, grijs & wit — de basiskleuren",
    colors: ["#c86b02", "#565555", "#ffffff"],
  },
  {
    id: "groep-1",
    name: "Groep 1 — Petrol & groen",
    description: "Diep petrolblauw, turquoise en zacht groen",
    colors: ["#003D4D", "#009CA0", "#9DC698"],
  },
  {
    id: "groep-2",
    name: "Groep 2 — Aarde & geel",
    description: "Roodbruin, warm geel en zacht lichtgeel",
    colors: ["#692616", "#F6C42A", "#F2EC85"],
  },
  {
    id: "groep-3",
    name: "Groep 3 — Groentinten",
    description: "Bosgroen, limoengroen en lichtgroen",
    colors: ["#375D28", "#BDD143", "#E8ECAD"],
  },
  {
    id: "groep-4",
    name: "Groep 4 — Aubergine & roze",
    description: "Aubergine, koraalrood en zacht roze",
    colors: ["#5D3753", "#E83C53", "#F9CBCC"],
  },
  {
    id: "groep-5",
    name: "Groep 5 — Rood & zand",
    description: "Donkerrood, oranjerood en zandbeige",
    colors: ["#AA2126", "#E5231B", "#E6CDA2"],
  },
  {
    id: "groep-6",
    name: "Groep 6 — Blauwtinten",
    description: "Marineblauw, helderblauw en lichtblauw",
    colors: ["#222152", "#4955A1", "#B8D8EA"],
  },
]

// Sample black & white line illustrations bundled with the app.
export type SampleImage = {
  id: string
  name: string
  src: string
}

export const SAMPLE_IMAGES: SampleImage[] = [
  { id: "wonen", name: "Wonen", src: "/samples/wonen.jpg" },
  { id: "economie", name: "Economie", src: "/samples/economie.jpg" },
  { id: "eco", name: "Ecologie", src: "/samples/eco.jpg" },
]
