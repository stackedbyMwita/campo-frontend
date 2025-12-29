import { BirdIcon } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      
      {/* 1. LEFT SIDE (Visuals - Hidden on Mobile) */}
      <div className="hidden bg-zinc-900 lg:flex flex-col justify-between p-10 text-white dark:border-r">
        
        {/* Top: Logo */}
        <div className="flex items-center gap-2 text-lg font-bold font-heading">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BirdIcon className="h-5 w-5" />
          </div>
          Campo Crowd
        </div>

        {/* Middle: The SVG Area */}
        <div className="flex items-center justify-center">
          {/* 👇 PLACE YOUR SVG HERE */}
          {/* For now, I put a placeholder circle */}
          <div className="h-64 w-64 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-500">
            [Insert SVG Here]
          </div>
        </div>

        {/* Bottom: Quote or Footer */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This platform has completely transformed how I earn online. 
              The tasks are simple, and the payments are instant.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">Sophia M., Earner Pro User</footer>
          </blockquote>
        </div>
      </div>

      {/* 2. RIGHT SIDE (The Form Container) */}
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-87.5 gap-6">
          {children}
        </div>
      </div>

    </div>
  );
}
