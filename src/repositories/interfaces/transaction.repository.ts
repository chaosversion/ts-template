export interface Transaction {
  id: string;
  title: string;
  amount: number;
  session_id: string;
  created_at: Date;
}

export interface TransactionRepository {
  create(transaction: Omit<Transaction, "id" | "created_at">): Promise<void>;
  findBySession(sessionId: string): Promise<Transaction[]>;
  findByID(id: string, sessionId: string): Promise<Transaction>;
  getSummary(sessionId: string): Promise<number>;
}
