'use client'

import { Avatar, AvatarFallback } from '@ai/components/ui/avatar'
import { useChatModel } from '@ai/contexts/chat-context'
import { Role } from '@ai/types/role'
import { Icon } from '@iconify/react'
import { listen } from '@tauri-apps/api/event'
import { motion } from 'framer-motion'
import { base64ToBlobUrl } from '@ai/lib/base64ToBlobUrl'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/hljs'

import Markdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'

export interface ReceivedMessage {
  model: string
  message: Message
  created_at: string
  done: boolean
}

export interface Message {
  role: string
  content: string
}

interface AudioControls {
  utterance: SpeechSynthesisUtterance
  isPlaying: boolean
}

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
      delayChildren: 0.3,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

function textToAudio(text: string, setAudioControls: (controls: AudioControls) => void) {
  if ('speechSynthesis' in window) {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)

    utterance.lang = 'pt-BR'
    utterance.pitch = 1
    utterance.rate = 1.6
    utterance.volume = 1

    setAudioControls({ utterance, isPlaying: true })

    synth.speak(utterance)
  } else {
    toast.error('Este navegador não suporta síntese de fala.')
  }
}

export function Content() {
  const { messages, addMessage, setIsTyping } = useChatModel()

  const replacer: Partial<Record<Role, string>> = {
    user: 'Você',
    assistant: 'Assistente',
    system: 'Sistema',
  }

  const mappedMessages = useMemo(() => {
    if (messages.length === 0) return []

    return messages.map(message => {
      if (message.image) {
        return {
          ...message,
          image: base64ToBlobUrl(message.image, 'image/png'),
        }
      }

      return message
    })
  }, [messages])

  useEffect(() => {
    const unlisten = listen<ReceivedMessage>('generate-answer-listener', ({ payload }) => {
      addMessage(prev => {
        const lastMessage = prev[prev.length - 1]

        if (lastMessage && !lastMessage.done) {
          return [
            ...prev.slice(0, -1),
            {
              role: payload.message.role as Role,
              content: lastMessage.content + payload.message.content,
              done: payload.done,
              created_at: payload.created_at,
            },
          ]
        }

        return [
          ...prev,
          {
            role: payload.message.role as Role,
            content: payload.message.content,
            done: payload.done,
            created_at: payload.created_at,
          },
        ]
      })
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [addMessage, setIsTyping])

  return (
    <main className="flex-1 overflow-hidden px-4 py-6 md:px-6 bg-background relative z-10">
      <motion.div className="mx-auto max-w-2xl space-y-4" variants={containerVariants} animate="visible" initial="hidden">
        {mappedMessages &&
          mappedMessages.map((chat, index) => (
            <motion.div key={index} variants={itemVariants} className="flex items-start gap-4">
              <Avatar className="w-8 h-8 border">
                <AvatarFallback>
                  {chat.role == 'user' ? (
                    <Icon icon="fluent-emoji:beaming-face-with-smiling-eyes" />
                  ) : (
                    <Icon icon="fluent-emoji:robot" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-bold select-none">{replacer[chat.role as Role]}</div>

                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '')

                      return !inline && match ? (
                        <SyntaxHighlighter style={dracula} PreTag="div" language={match[1]} {...props}>
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                  className="prose text-muted-foreground"
                >
                  {chat.content}
                </Markdown>

                {chat.image && (
                  <motion.img
                    src={chat.image}
                    alt="Imagem anexada"
                    whileTap={{
                      scale: 2,
                      marginTop: '80px',
                      position: 'relative',
                      zIndex: 9999,
                    }}
                    className="max-w-md max-h-md rounded-lg object-cover my-1.5 focus:outline-none"
                  />
                )}

                {chat.role !== 'system' && (
                  <div className="flex flex-row gap-2">
                    <motion.svg
                      whileHover={{ scale: 1.4, opacity: 0.8 }}
                      whileTap={{ scale: 0.8, opacity: 0.4, rotate: 10 }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      className="fill-muted-foreground/70 mt-0 focus:outline-none"
                      viewBox="0 0 24 24"
                      role="button"
                      onClick={() => {
                        navigator.clipboard.writeText(chat.content)
                        toast('Copiado!', { icon: <Icon icon="fluent-emoji:beaming-face-with-smiling-eyes" /> })
                      }}
                    >
                      <path
                        fill="currentColor"
                        d="M21 8.94a1.31 1.31 0 0 0-.06-.27v-.09a1.07 1.07 0 0 0-.19-.28l-6-6a1.07 1.07 0 0 0-.28-.19a.32.32 0 0 0-.09 0a.88.88 0 0 0-.33-.11H10a3 3 0 0 0-3 3v1H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1h1a3 3 0 0 0 3-3V9zm-6-3.53L17.59 8H16a1 1 0 0 1-1-1ZM15 19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1v7a3 3 0 0 0 3 3h5Zm4-4a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3v3a3 3 0 0 0 3 3h3Z"
                      ></path>
                    </motion.svg>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
      </motion.div>
    </main>
  )
}
