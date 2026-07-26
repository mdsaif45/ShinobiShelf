import { IBookRepository } from '../interfaces/IBookRepository';
import { Book } from '@/types';
import { adminDb } from '@/lib/firebase-admin';

export class FirestoreBookRepository implements IBookRepository {
  private collection = adminDb.collection('books');

  async findAll(): Promise<Book[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Book[];
  }

  async findById(id: string): Promise<Book | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Book;
  }

  async create(bookData: Partial<Book>): Promise<Book> {
    const docRef = await this.collection.add({
      ...bookData,
      status: bookData.status || 'AVAILABLE',
      createdAt: new Date().toISOString(),
    });
    const createdDoc = await docRef.get();
    return { id: createdDoc.id, ...createdDoc.data() } as Book;
  }

  async update(id: string, updates: Partial<Book>): Promise<Book | null> {
    const docRef = this.collection.doc(id);
    await docRef.update(updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.collection.doc(id).delete();
    return true;
  }
}
