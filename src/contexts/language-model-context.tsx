'use client'

import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react'

interface LanguageModelContextProps {
  selectedLanguage: string
  temperature: number[]
  topK: number[]
  topP: number[]
  setSelectedLanguage: (language: string) => void
  setTemperature: Dispatch<SetStateAction<number[]>>
  setTopK: Dispatch<SetStateAction<number[]>>
  setTopP: Dispatch<SetStateAction<number[]>>
}

const LanguageModelContext = createContext({} as LanguageModelContextProps)

export function LanguageModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [temperature, setTemperature] = useState([0.8])
  const [topK, setTopK] = useState([40.0])
  const [topP, setTopP] = useState([0.9])

  return (
    <LanguageModelContext.Provider
      value={{ selectedLanguage, temperature, topK, topP, setSelectedLanguage, setTemperature, setTopK, setTopP }}
    >
      {children}
    </LanguageModelContext.Provider>
  )
}

export const useLanguageModel = () => useContext(LanguageModelContext)
