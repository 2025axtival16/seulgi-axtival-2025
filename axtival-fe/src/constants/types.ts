export interface CommentData {
  page_id: string;
  title: string;
  comments: string[];
  url: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface TranscriptItem {
  id: string;
  speaker: string;
  content: string;
  timestamp: Date;
}
