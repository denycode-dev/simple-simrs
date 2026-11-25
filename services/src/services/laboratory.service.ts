import { withTransaction, type DatabasePool } from "../config/db.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/app-error.js";
import type { AuditRepository } from "../repositories/audit.repository.js";
import type { AuthRepository } from "../repositories/auth.repository.js";
import type {
  LabOrderItemRecord,
  LabOrderRecord,
  LaboratoryRepository,
} from "../repositories/laboratory.repository.js";
import type {
  CreateLabOrderBody,
  LabOrderStatus,
  ListLabOrdersQuery,
  SubmitLabResultsBody,
  UpdateLabOrderStatusBody,
} from "../schemas/laboratory.schema.js";

export interface RequestAuditContext {
  userId?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const ALLOWED_STATUS_TRANSITIONS: Record<LabOrderStatus, readonly LabOrderStatus[]> = {
  REQUESTED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export class LaboratoryService {
  constructor(
    private readonly pool: DatabasePool,
    private readonly labRepo: LaboratoryRepository,
    private readonly authRepo: AuthRepository,
    private readonly auditRepo: AuditRepository
  ) {}

  async listOrders(query: ListLabOrdersQuery): Promise<{
    orders: LabOrderRecord[];
    meta: { limit: number; count: number; next_cursor: number | null };
  }> {
    const orders = await this.labRepo.listOrders(query);
    const nextCursor =
      orders.length === query.limit ? orders[orders.length - 1].id : null;

    return {
      orders,
      meta: {
        limit: query.limit,
        count: orders.length,
        next_cursor: nextCursor,
      },
    };
  }

  async getOrderById(orderId: number): Promise<LabOrderRecord> {
    const order = await this.labRepo.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError("Data pemeriksaan laboratorium tidak ditemukan.");
    }
    return order;
  }

  async createOrder(
    input: CreateLabOrderBody,
    auditCtx: RequestAuditContext
  ): Promise<{
    id: number;
    order_number: string;
    status: LabOrderStatus;
    ordered_at: string;
    items_count: number;
    total_tariff: number;
    items: LabOrderItemRecord[];
  }> {
    return withTransaction(this.pool, async (client) => {
      const context = await this.labRepo.findRegistrationExamContext(
        input.registration_id,
        input.examination_id,
        client
      );

      if (!context) {
        throw new ValidationError("Data pendaftaran kunjungan tidak ditemukan.", {
          registration_id: ["Data pendaftaran kunjungan (registration_id) tidak ditemukan."],
        });
      }

      if (context.registration_status === "CANCELLED") {
        throw new ConflictError(
          "Kunjungan pasien telah dibatalkan, tidak dapat membuat order laboratorium."
        );
      }

      if (!context.examination_id) {
        throw new ValidationError(
          "Data pemeriksaan klinis dokter (RME) belum tersedia untuk kunjungan ini.",
          {
            examination_id: [
              "Pemeriksaan dokter (examination_id) tidak ditemukan untuk kunjungan ini.",
            ],
          }
        );
      }

      if (context.examination_registration_id !== input.registration_id) {
        throw new ValidationError(
          "Pemeriksaan dokter tidak sesuai dengan data pendaftaran kunjungan.",
          {
            examination_id: [
              "ID pemeriksaan dokter tidak terhubung dengan ID pendaftaran kunjungan yang dipilih.",
            ],
          }
        );
      }

      const orderNumber = await this.labRepo.generateNextOrderNumber(client);
      const clinicalNotes =
        input.clinical_notes && input.clinical_notes.length > 0
          ? input.clinical_notes
          : "Permintaan uji laboratorium diagnostik rawat jalan";

      const normalizedItems = input.items.map((item, idx) => ({
        test_name: item.test_name,
        test_code: item.test_code || `LAB-${String(idx + 1).padStart(3, "0")}`,
        reference_range:
          item.reference_range && item.reference_range.length > 0
            ? item.reference_range
            : "Normal",
        unit: item.unit && item.unit.length > 0 ? item.unit : "-",
        tariff: Number(item.tariff ?? 50000),
        notes: item.notes && item.notes.length > 0 ? item.notes : null,
      }));

      const totalTariff = normalizedItems.reduce((sum, item) => sum + item.tariff, 0);

      const createdOrder = await this.labRepo.insertOrder(
        {
          examinationId: Number(context.examination_id),
          registrationId: input.registration_id,
          orderNumber,
          clinicalNotes,
        },
        client
      );

      const insertedItems = await this.labRepo.batchInsertItems(
        createdOrder.id,
        normalizedItems,
        client
      );

      await this.labRepo.recalculateBillingForRegistration(input.registration_id, client);

      await this.auditRepo.insert(
        {
          userId: auditCtx.userId ?? null,
          action: "CREATE",
          module: "LABORATORY",
          recordId: createdOrder.id,
          newValues: {
            order_number: createdOrder.order_number,
            registration_id: input.registration_id,
            examination_id: Number(context.examination_id),
            items_count: insertedItems.length,
            total_tariff: totalTariff,
          },
          details: {
            event: "create_lab_order",
            test_codes: normalizedItems.map((i) => i.test_code),
          },
          ipAddress: auditCtx.ipAddress,
          userAgent: auditCtx.userAgent,
        },
        client
      );

      return {
        id: createdOrder.id,
        order_number: createdOrder.order_number,
        status: createdOrder.status,
        ordered_at: createdOrder.ordered_at,
        items_count: insertedItems.length,
        total_tariff: totalTariff,
        items: insertedItems,
      };
    });
  }

  async submitResults(
    orderId: number,
    input: SubmitLabResultsBody,
    auditCtx: RequestAuditContext
  ): Promise<{
    id: number;
    order_number: string;
    status: LabOrderStatus;
    completed_by: number | null;
    items: LabOrderItemRecord[];
  }> {
    return withTransaction(this.pool, async (client) => {
      const lockedOrder = await this.labRepo.lockOrderById(orderId, client);
      if (!lockedOrder) {
        throw new NotFoundError("Data order laboratorium tidak ditemukan.");
      }

      if (lockedOrder.status === "CANCELLED") {
        throw new ConflictError(
          "Order laboratorium yang telah dibatalkan tidak dapat diisi hasil pengujian."
        );
      }

      let resolvedCompletedBy: number | null = auditCtx.userId ?? null;
      if (resolvedCompletedBy === null && input.completed_by !== null) {
        const userExists = await this.authRepo.existsActiveUserById(
          input.completed_by,
          client
        );
        resolvedCompletedBy = userExists ? input.completed_by : null;
      }

      const updatedItems = await this.labRepo.batchUpdateResults(
        orderId,
        input.entries,
        client
      );

      if (updatedItems.length !== input.entries.length) {
        const updatedIds = new Set(updatedItems.map((i) => i.id));
        const missingIds = input.entries
          .map((e) => e.item_id)
          .filter((id) => !updatedIds.has(id));

        throw new ValidationError(
          "Terdapat item parameter laboratorium yang tidak ditemukan pada order ini.",
          {
            items: [
              `Item pemeriksaan dengan ID [${missingIds.join(", ")}] tidak terdaftar pada order ${lockedOrder.order_number}.`,
            ],
          }
        );
      }

      await this.labRepo.markOrderCompleted(orderId, resolvedCompletedBy, client);

      const abnormalCount = updatedItems.filter((item) =>
        item.status_flag && item.status_flag !== "NORMAL"
      ).length;

      await this.auditRepo.insert(
        {
          userId: resolvedCompletedBy,
          action: "UPDATE",
          module: "LABORATORY",
          recordId: orderId,
          oldValues: {
            status: lockedOrder.status,
          },
          newValues: {
            status: "COMPLETED",
            completed_by: resolvedCompletedBy,
            updated_items_count: updatedItems.length,
            abnormal_items_count: abnormalCount,
          },
          details: {
            event: "verify_lab_results",
            order_number: lockedOrder.order_number,
          },
          ipAddress: auditCtx.ipAddress,
          userAgent: auditCtx.userAgent,
        },
        client
      );

      return {
        id: orderId,
        order_number: lockedOrder.order_number,
        status: "COMPLETED",
        completed_by: resolvedCompletedBy,
        items: updatedItems,
      };
    });
  }

  async updateOrderStatus(
    orderId: number,
    input: UpdateLabOrderStatusBody,
    auditCtx: RequestAuditContext
  ): Promise<{
    id: number;
    order_number: string;
    previous_status: LabOrderStatus;
    status: LabOrderStatus;
  }> {
    return withTransaction(this.pool, async (client) => {
      const lockedOrder = await this.labRepo.lockOrderById(orderId, client);
      if (!lockedOrder) {
        throw new NotFoundError("Data order laboratorium tidak ditemukan.");
      }

      if (lockedOrder.status === input.status) {
        return {
          id: lockedOrder.id,
          order_number: lockedOrder.order_number,
          previous_status: lockedOrder.status,
          status: lockedOrder.status,
        };
      }

      const allowedNext = ALLOWED_STATUS_TRANSITIONS[lockedOrder.status];
      if (!allowedNext.includes(input.status)) {
        throw new ConflictError(
          `Transisi status order laboratorium dari '${lockedOrder.status}' ke '${input.status}' tidak diizinkan.`
        );
      }

      const completedBy =
        input.status === "COMPLETED" ? (auditCtx.userId ?? null) : null;

      await this.labRepo.updateOrderStatus(orderId, input.status, completedBy, client);

      if (input.status === "CANCELLED") {
        await this.labRepo.recalculateBillingForRegistration(
          lockedOrder.registration_id,
          client
        );
      }

      await this.auditRepo.insert(
        {
          userId: auditCtx.userId ?? null,
          action: "UPDATE",
          module: "LABORATORY",
          recordId: orderId,
          oldValues: { status: lockedOrder.status },
          newValues: { status: input.status, notes: input.notes ?? null },
          details: {
            event: "update_lab_order_status",
            order_number: lockedOrder.order_number,
          },
          ipAddress: auditCtx.ipAddress,
          userAgent: auditCtx.userAgent,
        },
        client
      );

      return {
        id: lockedOrder.id,
        order_number: lockedOrder.order_number,
        previous_status: lockedOrder.status,
        status: input.status,
      };
    });
  }
}
