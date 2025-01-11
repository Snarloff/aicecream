'use client'

import { Button } from '@ai/components/ui/button'
import { Icon } from '@iconify/react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { CpuIcon, MemoryStickIcon } from 'lucide-react'
import { Slider } from '@ai/components/ui/slider'
import { useTheme } from 'next-themes'
import { useLanguageModel } from '@ai/contexts/language-model-context'
import { Pacifico } from 'next/font/google'
import { useEffect, useState } from 'react'

import Link from 'next/link'
import { cn } from '@ai/lib/utils'

const pacificoFont = Pacifico({ weight: ['400'], subsets: ['latin'] })

export function Sidebar() {
  const { theme, setTheme } = useTheme()
  const { temperature, topK, topP, setTemperature, setTopK, setTopP } = useLanguageModel()

  const [cpu, setCpu] = useState(0)
  const [mem, setMem] = useState(0)

  useEffect(() => {
    invoke('init_process').catch(console.error)
  }, [])

  useEffect(() => {
    const fetchSystemInfo = async () => {
      const unlisten = await listen<{ cpu: number; mem: number }>('system-usage', ({ payload }) => {
        setCpu(payload.cpu)
        setMem(payload.mem)
      })

      return unlisten
    }

    fetchSystemInfo()
  }, [])

  return (
    <aside className="sticky top-0 h-screen border-r border-black/10 dark:border-muted/40 bg-muted/50 lg:block">
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-[60px] items-center border-b border-muted/40 px-6 animate-in fade-in-30 zoom-in select-none">
          <Link href="#" className="flex items-center gap-2 font-semibold" prefetch={false}>
            <Icon icon="fluent-emoji:shaved-ice" className="size-7" />
            <p className={cn(pacificoFont.className, 'text-xl')}>
              <span className="text-pink-400">A</span><span className='text-sky-400'>i</span>cecream
            </p>
          </Link>
        </div>
        <div className="flex-1 py-2 animate-in fade-in zoom-in">
          <nav className="grid items-start gap-y-2 px-4 text-sm font-medium">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 rounded-lg border border-black/10 bg-muted px-3 py-2 text-primary transition-all hover:bg-muted/50 w-full"
            >
              <CpuIcon className="h-4 w-4" />
              <span>CPU: {cpu}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 rounded-lg border border-black/10 bg-muted px-3 py-2 text-primary transition-all hover:bg-muted/50 w-full"
            >
              <MemoryStickIcon className="h-4 w-4" />
              <span>MEM: {mem}</span>
            </Button>

            <div className="mt-4 select-none">
              <label>Temperatura</label>
              <div className="flex flex-row gap-1">
                <Slider max={1} step={0.1} value={temperature} onValueChange={setTemperature} />
                <span className="text-sm">{temperature[0]}</span>
              </div>
            </div>

            <div className="select-none">
              <label>Top K</label>
              <div className="flex flex-row gap-1">
                <Slider max={100} step={10.0} value={topK} onValueChange={setTopK} />
                <span className="text-sm">{topK[0]}</span>
              </div>
            </div>

            <div className="select-none">
              <label>Top P</label>
              <div className="flex flex-row gap-1">
                <Slider max={1} step={0.1} value={topP} onValueChange={setTopP} />
                <span className="text-sm">{topP[0]}</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="p-4 animate-in spin-in">
          {theme === 'dark' ? (
            <Icon icon="fluent-emoji:sun" role="button" onClick={() => setTheme('light')} />
          ) : (
            <Icon icon="fluent-emoji:crescent-moon" role="button" onClick={() => setTheme('dark')} />
          )}
        </div>
      </div>
    </aside>
  )
}
