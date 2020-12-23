export interface Problem {
  config: {
    title: string
    tags?: string[]
  }
  output: string
  input: string
  description: string
}

export interface UserData {
  penalty: number
  solved: number
  problems: Record<number, { solvedTime?: number, try: number, pending?: true }>
  submits: Array<{ time: number, id: number, status: string, problem: number }>
}

export interface Data {
  submitId: number
  problemsStatus: Record<number, [number, number]>
  userData: Record<string, UserData>
}
