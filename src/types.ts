export interface Problem {
  config: {
    title: string
    tags?: string[]
  }
  outputs: string[]
  inputs: string[]
  time?: number
  memory?: number
  description: string
}

export interface UserData {
  penalty: number
  solved: number
  problems: Record<number, { solvedTime?: number, try: number, pending?: true, hash?: string }>
  submits: Array<{ time: number, id: number, status: string, problem: number }>
}

export interface Data {
  problemsHash: string
  submitId: number
  problemsStatus: Record<number, [number, number]>
  userData: Record<string, UserData>
}
