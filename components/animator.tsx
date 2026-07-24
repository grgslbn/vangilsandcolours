"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePicker, type SelectedImage } from "@/components/image-picker"
import {
  MotionSettingsPanel,
  DEFAULT_MOTION_SETTINGS,
  type MotionSettings,
} from "@/components/motion-settings"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clapperboard, Download, Loader2, VideoOff } from "lucide-react"
import { toast } from "sonner"

export function Animator() {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [motionSettings, setMotionSettings] = useState<MotionSettings>(DEFAULT_MOTION_SETTINGS)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed time counter while loading
  useEffect(() => {
    if (loading) {
      setElapsed(0)
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loading])

  async function animate() {
    if (!selectedImage) return
    setLoading(true)
    setError(null)
    setVideoUrl(null)

    try {
      const res = await fetch("/api/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage.src,
          prompt: motionSettings.prompt,
          duration: motionSettings.duration,
          cfgScale: motionSettings.cfgScale,
          negativePrompt: motionSettings.negativePrompt,
          tailImage: motionSettings.tailImage,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Er ging iets mis.")
      setVideoUrl(data.videoUrl)
      toast.success("Animatie klaar!")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Er ging iets mis."
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function downloadVideo() {
    if (!videoUrl) return
    const a = document.createElement("a")
    a.href = videoUrl
    a.download = "animatie.mp4"
    a.target = "_blank"
    a.click()
  }

  const canAnimate = !!selectedImage && !loading

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      {/* Controls */}
      <Card className="h-fit space-y-6 p-5">
        <ImagePicker selected={selectedImage} onSelect={setSelectedImage} />
        <div className="h-px bg-border" />
        <MotionSettingsPanel settings={motionSettings} onChange={setMotionSettings} />
        <Button
          className="w-full gap-2"
          size="lg"
          disabled={!canAnimate}
          onClick={animate}
        >
          <Clapperboard className="h-4 w-4" />
          {loading ? `Verwerken… ${formatElapsed(elapsed)}` : "Animeer met Kling"}
        </Button>
      </Card>

      {/* Result panel */}
      <Card className="p-5">
        <div className="flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Geanimeerd resultaat</p>
            {videoUrl && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                onClick={downloadVideo}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Download
              </Button>
            )}
          </div>

          {/* Preview area */}
          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
            {loading ? (
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    fal.ai verwerkt je animatie…
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dit duurt gemiddeld 30–60 seconden
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-primary">
                    {formatElapsed(elapsed)}
                  </p>
                </div>
                {/* Progress hint bar */}
                <div className="w-48 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all duration-1000"
                    style={{
                      width: `${Math.min((elapsed / 60) * 100, 95)}%`,
                    }}
                  />
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 px-6 text-center text-destructive">
                <VideoOff className="h-8 w-8" />
                <p className="text-sm">{error}</p>
              </div>
            ) : videoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="h-full max-h-[600px] w-full rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <Clapperboard className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Selecteer een afbeelding, stel de beweging in en klik op &quot;Animeer&quot;
                </p>
              </div>
            )}
          </div>

          {/* Original image preview strip */}
          {selectedImage && !loading && !videoUrl && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.src}
                alt={selectedImage.name}
                className="h-14 w-14 flex-shrink-0 rounded-md object-contain border border-border"
              />
              <div>
                <p className="text-xs font-medium text-card-foreground">{selectedImage.name}</p>
                <p className="text-xs text-muted-foreground">Klaar om te animeren</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
