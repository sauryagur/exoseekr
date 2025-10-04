import Link from "next/link"
import { RingedPlanetIcon } from "@/components/ringed-planet-icon"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Telescope, Thermometer, Ruler, Calendar } from "lucide-react"

// Sample exoplanet discovery data
const discoveries = [
  {
    id: 1,
    name: "Kepler-186f",
    type: "Super Earth",
    distance: "582 light-years",
    radius: "1.17 Earth radii",
    temperature: "-85°C",
    discoveryDate: "April 2014",
    habitableZone: true,
    confidence: 98.5,
    description: "First Earth-sized planet discovered in the habitable zone of another star.",
  },
  {
    id: 2,
    name: "TRAPPIST-1e",
    type: "Rocky Planet",
    distance: "40 light-years",
    radius: "0.92 Earth radii",
    temperature: "-22°C",
    discoveryDate: "February 2017",
    habitableZone: true,
    confidence: 96.2,
    description: "One of seven Earth-sized planets orbiting an ultra-cool dwarf star.",
  },
  {
    id: 3,
    name: "Proxima Centauri b",
    type: "Terrestrial",
    distance: "4.24 light-years",
    radius: "1.07 Earth radii",
    temperature: "-39°C",
    discoveryDate: "August 2016",
    habitableZone: true,
    confidence: 94.8,
    description: "Closest known exoplanet to our Solar System in the habitable zone.",
  },
  {
    id: 4,
    name: "HD 189733 b",
    type: "Hot Jupiter",
    distance: "64.5 light-years",
    radius: "1.14 Jupiter radii",
    temperature: "930°C",
    discoveryDate: "October 2005",
    habitableZone: false,
    confidence: 99.1,
    description: "Known for its deep blue color and extreme weather conditions.",
  },
  {
    id: 5,
    name: "K2-18b",
    type: "Mini-Neptune",
    distance: "124 light-years",
    radius: "2.61 Earth radii",
    temperature: "-73°C",
    discoveryDate: "December 2015",
    habitableZone: true,
    confidence: 91.3,
    description: "Water vapor detected in its atmosphere, potential for life.",
  },
  {
    id: 6,
    name: "55 Cancri e",
    type: "Super Earth",
    distance: "41 light-years",
    radius: "1.99 Earth radii",
    temperature: "2,400°C",
    discoveryDate: "August 2004",
    habitableZone: false,
    confidence: 97.6,
    description: "Possibly covered in graphite and diamond due to extreme heat.",
  },
]

export default function DiscoveriesPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0e1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0e1a]/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <RingedPlanetIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">exoseekr</span>
          </div>
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/upload" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Upload
            </Link>
            <Link href="/models" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Models
            </Link>
            <Link href="/training" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Training
            </Link>
            <Link href="/results" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Results
            </Link>
            <Link href="/discoveries" className="text-sm font-medium text-blue-400">
              Discoveries
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Telescope className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Exoplanet Discoveries</h1>
          </div>
          <p className="text-gray-400">
            Explore confirmed exoplanets detected by our AI models from TESS and Kepler light curve data.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{discoveries.length}</p>
                <p className="text-sm text-gray-400 mt-1">Total Discoveries</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{discoveries.filter((d) => d.habitableZone).length}</p>
                <p className="text-sm text-gray-400 mt-1">Habitable Zone</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">
                  {(discoveries.reduce((acc, d) => acc + d.confidence, 0) / discoveries.length).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-400 mt-1">Avg Confidence</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{new Set(discoveries.map((d) => d.type)).size}</p>
                <p className="text-sm text-gray-400 mt-1">Planet Types</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Discoveries Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {discoveries.map((planet) => (
            <Card key={planet.id} className="bg-[#0f1420] border-gray-800 hover:border-blue-500/50 transition-colors">
              <CardContent className="p-6">
                {/* Planet Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      <RingedPlanetIcon className="h-7 w-7 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{planet.name}</h3>
                      <Badge
                        variant="secondary"
                        className={`mt-1 ${
                          planet.habitableZone
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}
                      >
                        {planet.type}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{planet.description}</p>

                {/* Planet Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Telescope className="h-4 w-4 text-blue-400" />
                    <span className="text-gray-400">Distance:</span>
                    <span className="text-white font-medium">{planet.distance}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4 text-purple-400" />
                    <span className="text-gray-400">Radius:</span>
                    <span className="text-white font-medium">{planet.radius}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Thermometer className="h-4 w-4 text-orange-400" />
                    <span className="text-gray-400">Temperature:</span>
                    <span className="text-white font-medium">{planet.temperature}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <span className="text-gray-400">Discovered:</span>
                    <span className="text-white font-medium">{planet.discoveryDate}</span>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">AI Confidence</span>
                    <span className="text-white font-semibold">{planet.confidence}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${planet.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Habitable Zone Badge */}
                {planet.habitableZone && (
                  <Badge className="w-full justify-center bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20">
                    In Habitable Zone
                  </Badge>
                )}

                {/* View Details Button */}
                <Button
                  variant="outline"
                  className="w-full mt-4 border-blue-600 text-blue-400 hover:bg-blue-600/10 bg-transparent"
                >
                  View Full Analysis
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
