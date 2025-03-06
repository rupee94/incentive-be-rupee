export interface ITransactionService {
  execute(actions: any[]): Promise<void>;
}
