import { ILoanRepository } from '../interfaces/ILoanRepository';
import { BorrowRequest } from '@/types';
import { adminDb } from '@/lib/firebase-admin';

export class FirestoreLoanRepository implements ILoanRepository {
  private collection = adminDb.collection('borrowRequests');

  async findAll(): Promise<BorrowRequest[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BorrowRequest[];
  }

  async findById(id: string): Promise<BorrowRequest | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as BorrowRequest;
  }

  async create(data: Partial<BorrowRequest>): Promise<BorrowRequest> {
    const docRef = await this.collection.add({
      ...data,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
    const createdDoc = await docRef.get();
    return { id: createdDoc.id, ...createdDoc.data() } as BorrowRequest;
  }

  async updateStatus(id: string, status: BorrowRequest['status'], updates: Partial<BorrowRequest> = {}): Promise<BorrowRequest | null> {
    const docRef = this.collection.doc(id);
    await docRef.update({
      status,
      ...updates,
    });
    return this.findById(id);
  }

  async findByUser(userId: string): Promise<BorrowRequest[]> {
    const snapshot = await this.collection.get();
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BorrowRequest[];
    return docs.filter(l => l.borrowerId === userId || l.ownerId === userId);
  }
}
