import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import * as XLSX from 'xlsx'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json()
    
    // Create Excel file in memory
    const excelBuffer = await createExcelBuffer(formData)
    
    // Run Python script
    const scriptPath = path.join(process.cwd(), 'anomaly_detector.py')
    const trainingDataPath = path.join(process.cwd(), 'chatgpttrain.xlsx')
    
    return new Promise((resolve) => {
      const pythonProcess = exec(`python3 ${scriptPath} ${trainingDataPath} -`, (error, stdout, stderr) => {
        // Log raw output for debugging
        console.log('Raw stdout:', stdout)
        console.log('Raw stderr:', stderr)

        if (error) {
          console.error(`Execution Error: ${error.message}`)
          resolve(NextResponse.json({ 
            error: 'Failed to process data', 
            details: error.message 
          }, { status: 500 }))
          return
        }
        
        if (stderr) {
          console.error(`Script Error: ${stderr}`)
          resolve(NextResponse.json({ 
            error: 'Script execution error', 
            details: stderr 
          }, { status: 500 }))
          return
        }

        try {
          // Trim and parse output, with more robust error handling
          const trimmedOutput = stdout.trim()
          let results;
          
          try {
            results = JSON.parse(trimmedOutput)
          } catch (parseError) {
            console.error('JSON Parsing Error:', parseError)
            resolve(NextResponse.json({ 
              error: 'Failed to parse results', 
              details: trimmedOutput 
            }, { status: 500 }))
            return
          }

          // Check for error in results
          if (results.error) {
            resolve(NextResponse.json({ 
              error: results.error 
            }, { status: 500 }))
          } else {
            resolve(NextResponse.json(results))
          }
        } catch (unexpectedError) {
          console.error('Unexpected Error:', unexpectedError)
          resolve(NextResponse.json({ 
            error: 'Unexpected processing error', 
            details: unexpectedError.message
          }, { status: 500 }))
        }
      })

      // Write Excel data to stdin of Python process
      pythonProcess.stdin.write(excelBuffer)
      pythonProcess.stdin.end()
    })
  } catch (error) {
    console.error('Request Processing Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

async function createExcelBuffer(data: any): Promise<Buffer> {
  const worksheet = XLSX.utils.json_to_sheet([data])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}