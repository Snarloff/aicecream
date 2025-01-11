'use client'

import { Button } from '@ai/components/ui/button'
import { Textarea } from '@ai/components/ui/textarea'
import { useChatModel } from '@ai/contexts/chat-context'
import { useLanguageModel } from '@ai/contexts/language-model-context'
import { Icon } from '@iconify/react'
import { invoke } from '@tauri-apps/api/core'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import { uint8ArrayToBase64 } from '@ai/lib/uint8arrayToBase64'

import toast from 'react-hot-toast'
import { Role } from '@ai/types/role'

export function Footer() {
  const { selectedLanguage, temperature, topK, topP } = useLanguageModel()
  const { messages, isTyping, addMessage, setIsTyping } = useChatModel()

  const [image, setImage] = useState<string | null>(null)
  const [isHovered, setHover] = useState<boolean>(false)

  const prompt = useRef<HTMLTextAreaElement>(null)

  const handleSendPrompt = async () => {
    if (!prompt.current?.value) {
      return toast('Digite algo para começar!', {
        icon: <Icon icon="fluent-emoji:warning" className="size-5 mb-0.5" />,
      })
    }

    if (!selectedLanguage) {
      return toast('Selecione um modelo de linguagem!', {
        icon: <Icon icon="fluent-emoji:warning" className="size-5 mb-0.5" />,
      })
    }

    const newMessage = { role: 'user' as Role, content: prompt.current.value, done: true, image: image ? image : null }

    prompt.current.disabled = true
    prompt.current.value = ''

    setImage(null)
    addMessage(prev => [...prev, newMessage])
    setIsTyping(true)

    await invoke('send_prompt', {
      config: {
        language_model: selectedLanguage,
        temperature: temperature[0],
        top_p: topP[0],
        top_k: topK[0],
      },
      context: [...messages, newMessage],
    })
      .catch(() => {
        return toast.error('Erro ao enviar a pergunta para a IA!')
      })
      .finally(() => {
        prompt.current!.disabled = false
        setIsTyping(false)
      })
  }

  const handlePressEnter = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendPrompt()
    }
  }

  const handleOpenFile = async () => {
    const result = await open({
      multiple: false,
      filter: {
        name: 'Image Filter',
        extensions: ['png', 'jpeg'],
      },
    })

    if (!result) return

    await readFile(result.path).then(data => {
      if (!data) return toast.error('Erro ao abrir a imagem!')
      setImage(uint8ArrayToBase64(data))
    })
  }

  return (
    <footer className="max-w-2xl w-full sticky bottom-4 mx-auto py-2 flex flex-col gap-1.5 px-4 bg-background mb-6 z-50">
      {image && (
        <motion.div
          onHoverStart={() => setHover(true)}
          onHoverEnd={() => setHover(false)}
          onClick={() => setImage(null)}
          whileHover={{ color: '#f87171', cursor: 'pointer' }}
          whileTap={{ scale: 0.8 }}
          transition={{ duration: 0.4 }}
          className="flex flex-row gap-1 items-center text-muted-foreground text-sm mb-0.5 w-[20ch]"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isHovered ? 'hovered-icon' : 'default-icon'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Icon icon={isHovered ? 'mdi:trash' : 'mdi:image'} className="size-5" />
            </motion.span>
            <motion.span
              key={isHovered ? 'hovered-text' : 'default-text'}
              initial={{ x: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isHovered ? 'Remover imagem' : '(1) Imagem anexada'}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}

      <motion.div className="relative w-full" whileHover={{ scale: 1.1 }}>
        <motion.svg
          onClick={handleOpenFile}
          whileHover={{ scale: 1.4, opacity: 0.8 }}
          whileTap={{ scale: 0.8, opacity: 0.4, rotate: 10 }}
          xmlns="http://www.w3.org/2000/svg"
          className="size-6 absolute left-3 top-4 focus:outline-none"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          role="button"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8v8a5 5 0 1 0 10 0V6.5a3.5 3.5 0 1 0-7 0V15a2 2 0 0 0 4 0V8"
          ></path>
        </motion.svg>

        <Textarea
          ref={prompt}
          placeholder="Message Ollama... Be creative!"
          name="message"
          id="message"
          rows={1}
          onKeyDown={handlePressEnter}
          className="min-h-[48px] rounded-2xl resize-none py-4 border border-neutral-400 shadow-sm px-10"
          autoFocus
        />

        <Button
          type="submit"
          size="icon"
          className="absolute w-8 h-8 top-3 right-3"
          onClick={handleSendPrompt}
          disabled={isTyping}
        >
          {!isTyping ? <ArrowUpIcon className="w-4 h-4" /> : <Icon icon="eos-icons:three-dots-loading" className="size-12" />}
          <span className="sr-only">Send</span>
        </Button>
      </motion.div>

      <p className="text-xs font-medium text-center text-neutral-700 select-none">
        Models can make mistakes. Consider checking important information.
      </p>
    </footer>
  )
}
