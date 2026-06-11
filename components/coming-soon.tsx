export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-[calc(100vh-1px)] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  )
}
