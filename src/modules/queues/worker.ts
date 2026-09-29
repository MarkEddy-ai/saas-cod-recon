import { CarrierCsvLine, CarrierCsvLineSchema } from '@/contracts/schemas';
import { reconcileCarrierLine, ReconciliationResult } from '../reconciliation/matcher';

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BatchIngestionJob {
  job_id: string;
  store_id: string;
  carrier: string;
  total_lines: number;
  processed_lines: number;
  status: JobStatus;
  results: ReconciliationResult[];
  error?: string;
  created_at: string;
  completed_at?: string;
}

// In-memory queue store (remplaçable par Redis / BullMQ en cluster de production)
const jobRegistry = new Map<string, BatchIngestionJob>();

export class IngestionQueueEngine {
  /**
   * Initialise un Job et retourne immédiatement un ID de suivi (HTTP 202)
   */
  static enqueueBatchJob(
    storeId: string,
    carrier: string,
    rawLines: Array<{ rawLine: CarrierCsvLine; expectedCents: number }>
  ): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newJob: BatchIngestionJob = {
      job_id: jobId,
      store_id: storeId,
      carrier,
      total_lines: rawLines.length,
      processed_lines: 0,
      status: 'QUEUED',
      results: [],
      created_at: new Date().toISOString()
    };

    jobRegistry.set(jobId, newJob);

    // Déclenchement non-bloquant en tâche de fond (Worker Asynchrone)
    setTimeout(() => {
      this.processJob(jobId, rawLines);
    }, 50);

    return jobId;
  }

  /**
   * Traite les lots de colis par paquets (Chunking) pour préserver la mémoire
   */
  private static async processJob(
    jobId: string,
    items: Array<{ rawLine: CarrierCsvLine; expectedCents: number }>
  ) {
    const job = jobRegistry.get(jobId);
    if (!job) return;

    job.status = 'PROCESSING';
    const CHUNK_SIZE = 50;

    try {
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);

        for (const item of chunk) {
          // Validation de contrat stricte Zod (Agent 08)
          const validCarrierLine = CarrierCsvLineSchema.parse(item.rawLine);
          
          // Réconciliation sans aucun flottant (Agent 12)
          const reconciled = reconcileCarrierLine(item.expectedCents, validCarrierLine);
          job.results.push(reconciled);
          job.processed_lines += 1;
        }

        // Simule un yield d'I/O pour ne pas saturer l'event-loop
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      job.status = 'COMPLETED';
      job.completed_at = new Date().toISOString();
    } catch (err: any) {
      job.status = 'FAILED';
      job.error = err?.message || 'Erreur inattendue durant le traitement de lot';
    }
  }

  /**
   * Récupération du statut d'avancement d'un Job
   */
  static getJobStatus(jobId: string): BatchIngestionJob | undefined {
    return jobRegistry.get(jobId);
  }
}
