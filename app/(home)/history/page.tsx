import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const revalidate = 0

async function getResults() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('anomaly_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching results:', error)
    return []
  }

  // Ensure results are parsed if stored as JSON
  return data.map((item) => ({
    ...item,
    results: typeof item.results === 'string' ? JSON.parse(item.results) : item.results,
  }))
}

export default async function HistoryPage() {
  const results = await getResults()

  const countAnomalies = (results: any) => {
    if (!results) return 0
    return Object.entries(results).filter(([key, value]) =>
      key.endsWith('_Z_Score') && Math.abs(Number(value)) > 2
    ).length
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 pt-28">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Anomaly Detection History</h1>
        </div>
        <div className="space-y-8">
          {results.length === 0 ? (
            <Alert className="border-red-500">
              <AlertTitle>No Results Found</AlertTitle>
              <AlertDescription>
                No anomaly detection results are available for this user. Please run the detector and try again.
              </AlertDescription>
            </Alert>
          ) : (
            results.map((result, index) => (
              <Card key={index} className="bg-background border-green-500">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-green-500">
                    Result from {new Date(result.created_at).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Isolation Forest Anomaly:</span>
                      {result.results.Isolation_Forest_Anomaly ? (
                        <AlertTriangle className="text-yellow-500 h-6 w-6" />
                      ) : (
                        <CheckCircle className="text-green-500 h-6 w-6" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Distance Based Anomaly:</span>
                      {result.results.Distance_Based_Anomaly ? (
                        <AlertTriangle className="text-yellow-500 h-6 w-6" />
                      ) : (
                        <CheckCircle className="text-green-500 h-6 w-6" />
                      )}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center p-4 bg-muted rounded-md cursor-help">
                            <Info className="h-5 w-5 mr-2 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {countAnomalies(result.results)} out of 9 measurements showed an anomaly
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-80 bg-[#282831]">
                          <div className="space-y-2">
                            {Object.entries(result.results).map(([key, value]) => {
                              if (key.endsWith('_Z_Score')) {
                                const zScore = Number(value)
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}
