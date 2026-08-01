import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IEbookRepository, EbookRecord } from '../repositories/interfaces/IEbookRepository';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'ebooks');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class EbookService {
  constructor(private ebookRepo: IEbookRepository) {}

  async getUserEbooks(ownerId: string): Promise<EbookRecord[]> {
    return await this.ebookRepo.findAllByOwner(ownerId);
  }

  async getEbookById(id: string, ownerId: string): Promise<EbookRecord | null> {
    const ebook = await this.ebookRepo.findById(id);
    if (!ebook) return null;
    if (ebook.ownerId !== ownerId) {
      throw Object.assign(new Error('Access denied to this ebook'), { status: 403 });
    }
    return ebook;
  }

  async saveUploadedEbook(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    metadata: { title?: string; author?: string; description?: string; coverUrl?: string },
    ownerId: string
  ): Promise<EbookRecord> {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    let format: 'epub' | 'pdf' | 'txt' = 'txt';
    if (ext === 'epub' || file.mimetype.includes('epub')) {
      format = 'epub';
    } else if (ext === 'pdf' || file.mimetype.includes('pdf')) {
      format = 'pdf';
    } else if (ext === 'txt' || file.mimetype.includes('plain')) {
      format = 'txt';
    } else {
      throw Object.assign(new Error('Unsupported file format. Supported formats: EPUB, PDF, TXT'), {
        status: 400,
      });
    }

    const ebookId = `ebook_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const filename = `${ebookId}.${format}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Save binary file to disk
    fs.writeFileSync(filePath, file.buffer);

    const title = metadata.title?.trim() || path.basename(file.originalname, path.extname(file.originalname));
    const author = metadata.author?.trim() || 'Unknown Author';

    const record: Partial<EbookRecord> = {
      id: ebookId,
      title,
      author,
      description: metadata.description?.trim() || '',
      filePath: filename, // relative filename stored in db
      fileName: file.originalname,
      fileSize: file.size,
      fileFormat: format,
      coverUrl: metadata.coverUrl?.trim() || undefined,
      ownerId,
      progressPercent: 0,
      currentLocation: '',
    };

    return await this.ebookRepo.create(record);
  }

  async updateProgress(
    id: string,
    ownerId: string,
    progressPercent: number,
    currentLocation?: string
  ): Promise<EbookRecord | null> {
    const ebook = await this.getEbookById(id, ownerId);
    if (!ebook) {
      throw Object.assign(new Error('Ebook not found'), { status: 404 });
    }
    const clampedProgress = Math.min(100, Math.max(0, progressPercent));
    return await this.ebookRepo.updateProgress(id, clampedProgress, currentLocation);
  }

  async getEbookFileStream(id: string, ownerId: string): Promise<{ absolutePath: string; format: string; fileName: string }> {
    const ebook = await this.getEbookById(id, ownerId);
    if (!ebook) {
      throw Object.assign(new Error('Ebook not found'), { status: 404 });
    }

    const absolutePath = path.join(UPLOADS_DIR, ebook.filePath);
    if (!fs.existsSync(absolutePath)) {
      throw Object.assign(new Error('Ebook file missing on server disk'), { status: 404 });
    }

    return {
      absolutePath,
      format: ebook.fileFormat,
      fileName: ebook.fileName,
    };
  }

  async deleteEbook(id: string, ownerId: string): Promise<boolean> {
    const ebook = await this.getEbookById(id, ownerId);
    if (!ebook) {
      throw Object.assign(new Error('Ebook not found'), { status: 404 });
    }

    const absolutePath = path.join(UPLOADS_DIR, ebook.filePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error('Failed to delete file from disk:', err);
      }
    }

    return await this.ebookRepo.delete(id);
  }
}
