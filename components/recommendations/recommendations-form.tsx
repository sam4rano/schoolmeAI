"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator } from "lucide-react"

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
  "Agricultural Science",
  "Christian Religious Studies (CRS)",
  "Islamic Religious Studies (IRS)",
  "Further Mathematics",
  "Technical Drawing",
  "Food and Nutrition",
  "Home Economics",
  "French",
  "Yoruba",
  "Igbo",
  "Hausa",
]

interface RecommendationsFormProps {
  utme: string
  setUtme: (value: string) => void
  olevels: Record<string, string>
  setOlevels: (value: Record<string, string>) => void
  availableSubjects: string[]
  onGetRecommendations: () => void
}

export function RecommendationsForm({
  utme,
  setUtme,
  olevels,
  setOlevels,
  availableSubjects,
  onGetRecommendations,
}: RecommendationsFormProps) {
  return (
    <Card className="mb-4 sm:mb-6">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Enter Your Scores</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Fill in your UTME score and O-level grades to get recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
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
                    setOlevels({ ...olevels, [value]: "none" })
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {Object.entries(olevels).map(([subject, grade]) => (
              <div key={subject} className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">
                    {subject}
                  </label>
                  <Select
                    value={grade}
                    onValueChange={(value) =>
                      setOlevels({ ...olevels, [subject]: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="B3">B3</SelectItem>
                      <SelectItem value="C4">C4</SelectItem>
                      <SelectItem value="C5">C5</SelectItem>
                      <SelectItem value="C6">C6</SelectItem>
                      <SelectItem value="D7">D7</SelectItem>
                      <SelectItem value="E8">E8</SelectItem>
                      <SelectItem value="F9">F9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {subject !== "English Language" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => {
                      const newOlevels = { ...olevels }
                      delete newOlevels[subject]
                      setOlevels(newOlevels)
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add subjects you have grades for. English Language is required.
          </p>
        </div>

        <Button
          onClick={onGetRecommendations}
          disabled={!utme || !Object.values(olevels).some((v) => v && v !== "none")}
          className="w-full"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Get Recommendations
        </Button>
      </CardContent>
    </Card>
  )
}

