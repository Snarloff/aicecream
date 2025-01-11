'use client'

import { Button } from '@ai/components/ui/button'
import { useLanguageModel } from '@ai/contexts/language-model-context'
import { Icon } from '@iconify/react'
import { invoke } from '@tauri-apps/api/core'
import { Window } from '@tauri-apps/api/window'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ai/components/ui/dropdown-menu'

interface LanguageModel {
  name: string
  size: string
}

export function MenuBar() {
  const [appWindow, setAppWindow] = useState<Window>()
  const [languageModels, setLanguageModels] = useState<LanguageModel[]>([])

  const { selectedLanguage, setSelectedLanguage } = useLanguageModel()

  async function setupAppWindow() {
    const { Window } = await import('@tauri-apps/api/window')

    const appWindow = new Window('main')
    setAppWindow(appWindow)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupAppWindow()
    }
  }, [])

  useEffect(() => {
    invoke<LanguageModel[]>('get_models')
      .then(data => {
        setLanguageModels(
          data.map(model => {
            const sizeInGB = +model.size / 1024 ** 3
            const sizeInMB = +model.size / 1024 ** 2
            const sizeFormatted = sizeInGB >= 1 ? `${sizeInGB.toFixed(2)}GB` : `${sizeInMB.toFixed(2)}MB`

            return {
              name: model.name /* .split(':')[0] */,
              size: sizeFormatted,
            }
          })
        )
      })
      .catch(() => {
        toast.error('Erro! Verifique se o programa ollama está aberto!')
      })
  }, [])

  const minimize = () => appWindow?.minimize()

  const maximize = async () => {
    const isMaximized = await appWindow?.isMaximized()
    appWindow?.[isMaximized ? 'unmaximize' : 'maximize']()
  }

  const close = () => appWindow?.close()

  return (
    <header
      data-tauri-drag-region
      className="sticky top-0 z-50  flex h-14 items-center justify-between w-full border-b border-black/10 dark:border-muted/40 bg-muted/50 shadow-sm backdrop-blur-lg px-6 lg:h-[60px]"
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          className="animate-in fade-in-30 zoom-in focus-visible:ring-0 focus-visible:ring-transparent"
        >
          <Button variant="ghost" className="rounded-full border border-black/10 bg-muted py-2 px-4 hover:bg-muted/50">
            <div className="flex flex-row items-center gap-2">
              <Icon icon="fluent-emoji:sparkles" className="size-4" />
              <span>{!selectedLanguage ? 'Selecione um modelo' : selectedLanguage}</span>
              <Icon icon="iconamoon:arrow-down-2-thin" className="size-5" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Modelos</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {languageModels.map(model => (
            <DropdownMenuCheckboxItem
              key={model.name}
              checked={selectedLanguage === model.name}
              onCheckedChange={() => setSelectedLanguage(model.name)}
              className="flex flex-col gap-0 justify-start items-start"
            >
              <span className="font-medium text-base">{model.name}</span>
              <small className="text-card-foreground">{model.size}</small>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex gap-4">
        <Icon icon="mdi:window-minimize" className="cursor-pointer" role="button" onClick={minimize} />
        <Icon icon="mdi:window-maximize" className="cursor-pointer" role="button" onClick={maximize} />
        <Icon icon="mdi:window-close" className="cursor-pointer" role="button" onClick={close} />
      </div>
    </header>
  )
}
