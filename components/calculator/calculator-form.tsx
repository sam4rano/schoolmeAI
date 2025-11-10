"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, Building2 } from "lucide-react"
import Link from "next/link"

const COMMON_OLEVEL_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "Geography",
  "History",
  "Commerce",
  "Accounting",
  "Further Mathematics",
  "Agricultural Science",
  "Technical Drawing",
]

const OLEVEL_GRADES = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"]

interface CalculatorFormProps {
  utme: string
  setUtme: (value: string) => void
  olevels: Record<string, string>
  setOlevels: (value: Record<string, string>) => void
  programId: string
  setProgramId: (value: string) => void
  selectedProgram: any
  availableSubjects: string[]
  onCalculate: () => void
  loading: boolean
  error: string | null
}

export function CalculatorForm({
  utme,
  setUtme,
  olevels,
  setOlevels,
  programId,
  setProgramId,
  selectedProgram,
  availableSubjects,
  onCalculate,
  loading,
  error,
}: CalculatorFormProps) {
  const [customSubject, setCustomSubject] = useState("")

  const addCustomSubject = () => {
    if (customSubject && !olevels[customSubject]) {
      setOlevels({ ...olevels, [customSubject]: "" })
      setCustomSubject("")
    }
  }

  const removeSubject = (subject: string) => {
    const newOlevels = { ...olevels }
    delete newOlevels[subject]
    setOlevels(newOlevels)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eligibility Calculator</CardTitle>
        <CardDescription>
          Fill in your UTME score and O-level grades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${utme ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              1
            </div>
            <span className="text-sm font-medium">Scores</span>
          </div>
          <div className="flex-1 h-px bg-muted mx-2" />
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${programId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              2
            </div>
            <span className="text-sm font-medium">Program</span>
          </div>
          <div className="flex-1 h-px bg-muted mx-2" />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
              3
            </div>
            <span className="text-sm font-medium">Result</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            UTME Score (0-400)
          </label>
          <Input
            type="number"
            min="0"
            max="400"
            value={utme}
            onChange={(e) => setUtme(e.target.value)}
            placeholder="Enter your UTME score"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              O-level Grades
            </label>
            {availableSubjects.filter((s) => !olevels[s]).length > 0 && (
              <Select
                onValueChange={(value) => {
                  if (value && !olevels[value]) {
                    setOlevels({ ...olevels, [value]: "" })
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Add subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects
                    .filter((s) => !olevels[s])
                    .map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            {Object.entries(olevels).map(([subject, grade]) => (
              <div key={subject} className="flex items-center gap-2">
                <span className="flex-1 text-sm">{subject}</span>
                <Select
                  value={grade}
                  onValueChange={(value) =>
                    setOlevels({ ...olevels, [subject]: value })
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {OLEVEL_GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubject(subject)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          {Object.keys(olevels).length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Add at least one O-level subject
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Program
          </label>
          {/* Program selection will be handled by parent */}
          {selectedProgram && (
            <div className="mt-3 p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm">{selectedProgram.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>{selectedProgram.institution?.name}</span>
                    <span>•</span>
                    <span>{selectedProgram.institution?.state}</span>
                  </div>
                  {selectedProgram.faculty && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Faculty: {selectedProgram.faculty}
                    </p>
                  )}
                </div>
                <Link
                  href={`/programs/${selectedProgram.id}`}
                  className="text-xs text-primary hover:underline flex-shrink-0 ml-2"
                >
                  View Details →
                </Link>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={onCalculate}
          disabled={loading || !utme || !programId}
          className="w-full"
        >
          {loading ? "Calculating..." : "Calculate Eligibility"}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

