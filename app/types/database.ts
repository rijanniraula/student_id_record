export type ClassItem = {
    id: number
    name: string
  }
  
  export type StudentItem = {
    id: number
    class_id: number
    name: string
    roll_number?: string
    created_at: string
  }
  
  export type PhotoItem = {
    id: number
    student_id: number
    path: string
    created_at: string
  }