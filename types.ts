
export interface User {
  name: string;
  email: string;
  role: string;
  // Fix: Allow progress to be a string, as it might be returned from the Google Sheet API.
  progress?: { [key: string]: boolean } | string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  date: string;
  icon: string;
  url: string;
  topics: string[];
}

export interface Module {
  id: string;
  title: string;
  objective: string;
  description: string;
  videos: Video[];
}

export interface Student {
  id: string;
  name: string;
  role: string;
  email: string;
  skills?: string[];
  progress: number;
  icon?: string;
  fase1Progress: { [key: string]: boolean };
  fase2Progress: { [key: string]: boolean };
  joinDate: string;
}

export type TabId = 'overview' | 'fase1' | 'fase2' | 'aula-virtual' | 'students' | 'resources' | 'calendar';