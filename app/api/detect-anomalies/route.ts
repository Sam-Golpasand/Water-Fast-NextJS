import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import * as XLSX from 'xlsx'
import path from 'path'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.json()
   
    // Create Excel file in memory
    const excelBuffer = await createExcelBuffer(formData)
   
    // Run Python script
    const scriptPath = path.join(process.cwd(), 'python/main.py')
    const trainingDataPath = path.join(process.cwd(), 'python/trainingData.xlsx')
    
    return new Promise<NextResponse>((resolve) => {
      const pythonInterpreter = path.join(process.cwd(), '/python/.venv/bin/python');
      const pythonProcess = exec(
        `${pythonInterpreter} ${scriptPath} ${trainingDataPath}`,
        { maxBuffer: 1024 * 1024 * 10 },
        (error, stdout, stderr) => {
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

          const trimmedOutput = stdout.trim()
          try {
            const results = JSON.parse(trimmedOutput)
            resolve(NextResponse.json(results))
            console.log(trimmedOutput)
          } catch (parseError) {
            console.error('JSON Parsing Error:', parseError)
            resolve(NextResponse.json({
              error: 'Failed to parse results',
              details: trimmedOutput
            }, { status: 500 }))
          }
        }
      )
      
      // Write Excel data to stdin of Python process
      pythonProcess.stdin?.write(excelBuffer)
      pythonProcess.stdin?.end()
    })
  } catch (error) {
    console.error('Request Processing Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 })
  }
}

async function createExcelBuffer(data: any): Promise<Buffer> {
  const worksheet = XLSX.utils.json_to_sheet([data])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

