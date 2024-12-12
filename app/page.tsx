'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import FloatingLabelInput from "@/components/FloatingLabelInput"

export default function AnomalyDetector() {
  const [formData, setFormData] = useState({
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
  const [results, setResults] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      setError('An error occurred while processing the data.')
    } finally {
      setLoading(false)
    }
  }

  const renderAnomalyExplanation = (type: string, isAnomaly: boolean) => {
    if (!isAnomaly) return null;
    
    const explanations = {
      'Isolation_Forest_Anomaly': 'This indicates that the data point is significantly different from the majority of the data, based on the Isolation Forest algorithm.',
      'Distance_Based_Anomaly': 'This suggests that the data point is statistically distant from the average values in the dataset.'
    }

    return (
      <Alert variant="warning" className="mt-2 bg-yellow-900 border-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Anomaly Detected</AlertTitle>
        <AlertDescription>{explanations[type as keyof typeof explanations]}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          <h3 className='text-muted-foreground text-sm mb-4'>ANOMALY DETECTION SYSTEM</h3>
          <h2 className="text-3xl font-bold mb-6 text-left text-foreground">Detect Anomalies<span className='text-green-500'>.</span></h2>
          <Card className="mb-8 bg-background border-green-500">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-green-400">Patient Data Input</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FloatingLabelInput value={formData.length} onChange={handleInputChange} label="Length" id="length" name="length" />
                <div className="grid grid-cols-2 gap-4">
                  {['weight', 'bmi', 'waist', 'pulse'].map(metric => (
                    <div key={metric} className="space-y-2">
                      <FloatingLabelInput value={formData[`${metric}pre`]} onChange={handleInputChange} label={`${metric.charAt(0).toUpperCase() + metric.slice(1)} Pre`} id={`${metric}pre`} name={`${metric}pre`} />
                      <FloatingLabelInput value={formData[`${metric}post`]} onChange={handleInputChange} label={`${metric.charAt(0).toUpperCase() + metric.slice(1)} Post`} id={`${metric}post`} name={`${metric}post`} />
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

          {error && (
            <Alert variant="destructive" className="mb-8 bg-red-900 border-red-600">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
{/* Results section */}
<div className="hidden lg:flex lg:w-1/2 items-center justify-center px-6 py-12 lg:px-8">
  {results ? (
    <Card className="w-full max-w-md bg-background border-green-500">
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
          <Separator className="my-4 bg-muted" />
          <div className="space-y-2">
            {Object.entries(results).map(([key, value]) => {
              if (key.endsWith('_Z_Score')) {
                return (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{key.replace('_Z_Score', '')} Z-Score:</span>
                    <span className={`font-mono ${Number(value) > 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {Number(value).toFixed(2)}
                    </span>
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  ) : (
    <div className="text-center text-muted-foreground">
      <p className="text-lg">Submit patient data to view anomaly detection results</p>
    </div>
  )}
</div>

    </div>
  )
}