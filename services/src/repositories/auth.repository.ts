import type { QueryExecutor } from "../config/db.js";

export type SimrsRole =
  | "admin"
  | "registration"
  | "nurse"
  | "doctor"
  | "pharmacist"
  | "lab"
  | "cashier";

export interface AuthenticatedUser {
  id: number;
  username: string;
  full_name: string;
  role: SimrsRole;
}

export class AuthRepository {
  constructor(private readonly db: QueryExecutor) {}

  async findActiveUserByToken(token: string): Promise<AuthenticatedUser | null> {
    const query = `
      SELECT id, username, full_name, role
      FROM users
      WHERE access_token = $1
        AND is_active = true
      LIMIT 1;
    `;
    const { rows } = await this.db.query<AuthenticatedUser>(query, [token]);
    return rows[0] ?? null;
  }

  async existsActiveUserById(userId: number, client?: QueryExecutor): Promise<boolean> {
    const executor = client ?? this.db;
    const { rows } = await executor.query<{ id: number }>(
      "SELECT id FROM users WHERE id = $1 AND is_active = true LIMIT 1;",
      [userId]
    );
    return rows.length > 0;
  }
}
