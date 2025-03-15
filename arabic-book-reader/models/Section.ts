export interface Section {
  id: number;
  title: string;
  startPage: number;
  endPage: number;
  isCompleted: boolean;
  audioUrl?: string;
  manzilNumber?: number; // Optional manzil number for tracking progress
  completionDate?: Date; // Date when the section was completed
}

// Sample data for the book sections
export const SECTIONS: Section[] = [
  {
    id: 1,
    title: 'Manzil 1',
    startPage: 1,
    endPage: 22,
    isCompleted: false,
    audioUrl: 'https://example.com/audio/manzil1.mp3',
    manzilNumber: 1
  },
  {
    id: 2,
    title: 'Manzil 2',
    startPage: 22,
    endPage: 42,
    isCompleted: false,
    audioUrl: 'https://example.com/audio/manzil2.mp3',
    manzilNumber: 2
  },
  {
    id: 3,
    title: 'Manzil 3',
    startPage: 42,
    endPage: 64,
    isCompleted: false,
    audioUrl: 'https://example.com/audio/manzil3.mp3',
    manzilNumber: 3
  },
  {
    id: 4,
    title: 'Manzil 4',
    startPage: 64,
    endPage: 89,
    isCompleted: false,
    audioUrl: 'https://example.com/audio/manzil4.mp3',
    manzilNumber: 4
  },
  {
    id: 5,
    title: 'Manzil 5',
    startPage: 89,
    endPage: 109,
    isCompleted: false,
    audioUrl: 'https://example.com/audio/manzil5.mp3',
    manzilNumber: 5
  },
  {
    id: 6,
    title: 'Manzil 6',
    startPage: 109,
    endPage: 128,
    isCompleted: false,
    audioUrl: 'https://example.com/audio/manzil6.mp3',
    manzilNumber: 6
  },
  {
    id: 7,
    title: 'Manzil 7',
    startPage: 128,
    endPage: 150,
    isCompleted: false,
    audioUrl: 'https://example.com/audio/manzil7.mp3',
    manzilNumber: 7
  }
]; 