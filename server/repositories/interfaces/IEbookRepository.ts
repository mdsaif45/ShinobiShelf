export interface EbookRecord {
  id: string;
  title: string;
  author?: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileFormat: 'epub' | 'pdf' | 'txt';
  coverUrl?: string;
  ownerId: string;
  progressPercent: number;
  currentLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEbookRepository {
  findAllByOwner(ownerId: string): Promise<EbookRecord[]>;
  findById(id: string): Promise<EbookRecord | null>;
  create(ebook: Partial<EbookRecord>): Promise<EbookRecord>;
  updateProgress(id: string, progressPercent: number, currentLocation?: string): Promise<EbookRecord | null>;
  delete(id: string): Promise<boolean>;
}
