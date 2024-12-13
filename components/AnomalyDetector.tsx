'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import FloatingLabelInput from "@/components/FloatingLabelInput"
import { useRouter } from 'next/navigation'

interface FormData {
  patientnumber: string
  length: string
  weightpre: string
  weightpost: string
  bmipre: string
  bmipost: string
  waistpre: string
  waistpost: string
  pulsepre: string
  pulsepost: string
}

interface Results {
  Isolation_Forest_Anomaly: boolean
  Distance_Based_Anomaly: boolean
  [key: string]: number | boolean
}

export default function AnomalyDetector({ userId }: { userId: string }) {
  const [formData, setFormData] = useState<FormData>({
    patientnumber: "1",
    length: '',
    weightpre: '',
    weightpost: '',
    bmipre: '',
    bmipost: '',
    waistpre: '',
    waistpost: '',
    pulsepre: '',
    pulsepost: ''
  })
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/detect-anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to process data')
      }

      const data = await response.json()
      setResults(Array.isArray(data) ? data[0] : data)

      // Upload results to Supabase
      await fetch('/api/upload-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, results: data }),
      })

    } catch (err) {
      setError('An error occurred while processing the data.')
    } finally {
      setLoading(false)
    }
  }

  const renderAnomalyExplanation = (type: 'Isolation_Forest_Anomaly' | 'Distance_Based_Anomaly', isAnomaly: boolean) => {
    if (!isAnomaly) return null
    
    const explanations = {
      'Isolation_Forest_Anomaly': 'This indicates that the data point is significantly different from the majority of the data, based on the Isolation Forest algorithm.',
      'Distance_Based_Anomaly': 'This suggests that the data point is statistically distant from the average values in the dataset.'
    }

    return (
      <Alert className="mt-2 bg-yellow-900 border-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Anomaly Detected</AlertTitle>
        <AlertDescription>{explanations[type]}</AlertDescription>
      </Alert>
    )
  }

  const countAnomalies = (results: Results) => {
    return Object.entries(results).filter(([key, value]) => 
      key.endsWith('_Z_Score') && Math.abs(Number(value)) > 2
    ).length
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pt-28">
      <div className="w-full max-w-6xl mx-auto px-8 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-8">Detect Anomalies<span className='text-green-500'>.</span></h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-background border-green-500">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-green-400">Patient Data Input</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FloatingLabelInput value={formData.length} onChange={handleInputChange} label="Length" id="length" name="length" />
                <div className="grid grid-cols-2 gap-4">
                  {(['weight', 'bmi', 'waist', 'pulse'] as const).map(metric => (
                    <div key={metric} className="space-y-2">
                      <FloatingLabelInput 
                        value={formData[`${metric}pre` as keyof FormData]} 
                        onChange={handleInputChange} 
                        label={`${metric.charAt(0).toUpperCase() + metric.slice(1)} Pre`} 
                        id={`${metric}pre`} 
                        name={`${metric}pre`} 
                      />
                      <FloatingLabelInput 
                        value={formData[`${metric}post` as keyof FormData]} 
                        onChange={handleInputChange} 
                        label={`${metric.charAt(0).toUpperCase() + metric.slice(1)} Post`} 
                        id={`${metric}post`} 
                        name={`${metric}post`} 
                      />
                    </div>
                  ))}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing
                    </>
                  ) : (
                    'Detect Anomalies'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {results ? (
            <Card className="bg-background border-green-500">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-green-500">Anomaly Detection Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Isolation Forest Anomaly:</span>
                    {results.Isolation_Forest_Anomaly ? (
                      <AlertTriangle className="text-yellow-500 h-6 w-6" />
                    ) : (
                      <CheckCircle className="text-green-500 h-6 w-6" />
                    )}
                  </div>
                  {renderAnomalyExplanation('Isolation_Forest_Anomaly', results.Isolation_Forest_Anomaly)}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Distance Based Anomaly:</span>
                    {results.Distance_Based_Anomaly ? (
                      <AlertTriangle className="text-yellow-500 h-6 w-6" />
                    ) : (
                      <CheckCircle className="text-green-500 h-6 w-6" />
                    )}
                  </div>
                  {renderAnomalyExplanation('Distance_Based_Anomaly', results.Distance_Based_Anomaly)}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center p-4 bg-muted rounded-md cursor-help">
                          <Info className="h-5 w-5 mr-2 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {countAnomalies(results)} out of 9 measurements are showing an anomaly
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 bg-[#282831]">
                        <div className="space-y-2">
                          {Object.entries(results).map(([key, value]) => {
                            if (key.endsWith('_Z_Score')) {
                              const zScore = Number(value);
                              return (
                                <div key={key} className="flex justify-between items-center">
                                  <span className="text-muted-foreground">{key.replace('_Z_Score', '')}:</span>
                                  <span className={`font-mono ${Math.abs(zScore) > 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                                    {zScore.toFixed(2)}
                                  </span>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg text-muted-foreground">Submit patient data to view anomaly detection results</p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-8 bg-red-900 border-red-600">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

