'use client'

import { Chat } from '@ai/types/chat'
import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react'

interface ChatContextProps {
  messages: Chat[]
  isTyping: boolean
  addMessage: Dispatch<SetStateAction<Chat[]>>
  setIsTyping: Dispatch<SetStateAction<boolean>>
}

export const ChatContext = createContext({} as ChatContextProps)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, addMessage] = useState<Chat[]>([
    {
      role: 'system',
      content: 'Você pode me fazer **perguntas** ou me dar **comandos**. Estou aqui para **te ajudar**!',
      done: true,
    },
  ])

  const [isTyping, setIsTyping] = useState<boolean>(false)

  return <ChatContext.Provider value={{ messages, addMessage, isTyping, setIsTyping }}>{children}</ChatContext.Provider>
}

export const useChatModel = () => useContext(ChatContext)
