"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

const SUGGESTED_QUESTIONS = [
  "What are the best universities in Lagos?",
  "What programs can I apply for with 240 UTME score?",
  "What are the admission requirements for Medicine?",
  "Which universities offer Computer Science?",
  "What is the cutoff mark for Law at UNILAG?",
  "How do I calculate my admission probability?",
  "What are the best polytechnics in Nigeria?",
  "Which institutions offer Nursing programs?",
]

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void
  loading: boolean
  disabled?: boolean
  show?: boolean
}

export function SuggestedQuestions({
  onSelectQuestion,
  loading,
  disabled = false,
  show = true,
}: SuggestedQuestionsProps) {
  if (!show) return null

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Suggested Questions
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Click on any question to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUGGESTED_QUESTIONS.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="h-auto py-3 px-4 text-left justify-start whitespace-normal"
              onClick={() => onSelectQuestion(question)}
              disabled={loading || disabled}
            >
              <span className="text-xs sm:text-sm">{question}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

