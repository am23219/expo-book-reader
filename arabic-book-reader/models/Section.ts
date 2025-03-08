export interface Section {
  id: number;
  title: string;
  startPage: number;
  endPage: number;
  audioFile: string;
  isCompleted: boolean;
}

// Define the 7 manzils of the PDF
export const SECTIONS: Section[] = [
  {
    id: 1,
    title: "Manzil 1",
    startPage: 1,
    endPage: 22,
    audioFile: 'section1.mp3',
    isCompleted: false
  },
  {
    id: 2,
    title: "Manzil 2",
    startPage: 22,
    endPage: 42,
    audioFile: 'section2.mp3',
    isCompleted: false
  },
  {
    id: 3,
    title: "Manzil 3",
    startPage: 42,
    endPage: 64,
    audioFile: 'section3.mp3',
    isCompleted: false
  },
  {
    id: 4,
    title: "Manzil 4",
    startPage: 64,
    endPage: 89,
    audioFile: 'section4.mp3',
    isCompleted: false
  },
  {
    id: 5,
    title: "Manzil 5",
    startPage: 89,
    endPage: 109,
    audioFile: 'section5.mp3',
    isCompleted: false
  },
  {
    id: 6,
    title: "Manzil 6",
    startPage: 109,
    endPage: 128,
    audioFile: 'section6.mp3',
    isCompleted: false
  },
  {
    id: 7,
    title: "Manzil 7",
    startPage: 128,
    endPage: 150,
    audioFile: 'section7.mp3',
    isCompleted: false
  }
]; 