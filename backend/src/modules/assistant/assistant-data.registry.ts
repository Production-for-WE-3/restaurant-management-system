/**
 * The assistant is allowed to read only through this registry.
 *
 * This is intentionally a backend-owned capability list. It is not a list of
 * database tables that the LLM may query. Each handler must still apply the
 * tenant and outlet scope before returning data.
 */
export const ASSISTANT_DATA_PERMISSIONS = {
  occupancy: [['dining-tables.view']],
  inventory: [['inventory-stock.view', 'ingredients.view', 'warehouses.view']],
  menu: [['foods.view']],
  staffSummary: [['employees.view']],
  payments: [['order-payments.view']],
  serviceIssues: [['orders.view']],
  cancellations: [['reservations.view']],
  bookings: [['reservations.view']],
  customers: [['customers.view']],
  revenue: [['dashboard.view'], ['reports.view']],
  orderDetails: [['orders.view']],
  overview: [['dashboard.view'], ['reports.view']],
} as const;

export const ASSISTANT_ALLOWED_TABLES: Record<string, ReadonlySet<string>> = {
  occupancy: new Set(['dining_tables', 'outlets']),
  inventory: new Set(['warehouse_ingredient_stocks', 'ingredients', 'warehouses']),
  menu: new Set(['foods']),
  staffSummary: new Set(['employees', 'employee_outlet_assignments']),
  payments: new Set(['order_payments']),
  serviceIssues: new Set(['service_requests']),
  cancellations: new Set(['reservations']),
  bookings: new Set(['reservations']),
  customers: new Set(['orders']),
  revenue: new Set(['orders']),
  orderDetails: new Set(['orders', 'order_items', 'foods']),
  overview: new Set(['orders']),
};

/**
 * Existing read permissions that may be added as assistant datasets. Keeping
 * this list here makes the security review explicit: a new assistant dataset
 * must be paired with an existing backend .view permission and a safe handler.
 */
export const ASSISTANT_READ_PERMISSION_SLUGS = new Set([
  'addons.view', 'addon-groups.view', 'attendance.view', 'audit-logs.view',
  'customer-credit.view', 'customers.view', 'dining-areas.view',
  'dining-tables.view', 'employees.view', 'food-categories.view',
  'food-variants.view', 'foods.view', 'goods-receiving.view',
  'ingredient-categories.view', 'ingredient-wastages.view', 'ingredients.view',
  'inventory-stock.view', 'loyalty.view', 'order-payments.view',
  'orders.view', 'outlet-departments.view', 'outlets.view',
  'purchase-orders.view', 'purchase-returns.view', 'reports.view',
  'reservations.view', 'service-requests.view', 'settings.view',
  'shifts.view', 'stock-adjustments.view', 'stock-counts.view',
  'stock-ins.view', 'stock-outs.view', 'stock-transfers.view',
  'supplier-payments.view', 'suppliers.view', 'table-sessions.view',
  'units.view', 'warehouses.view',
]);

export const ASSISTANT_BLOCKED_TABLES = new Set([
  'users', 'roles', 'permissions', 'role_permissions', 'user_role_assignments',
  'refresh_tokens', 'customer_refresh_tokens', 'typeorm_migrations',
]);

export function assertAssistantDataAccess(
  intent: keyof typeof ASSISTANT_DATA_PERMISSIONS,
  tables: Iterable<string>,
): void {
  const normalized = [...new Set(Array.from(tables).map((table) => table.trim()))]
    .filter(Boolean)
    .map((table) => table.toLowerCase());

  const blocked = normalized.filter((table) =>
    ASSISTANT_BLOCKED_TABLES.has(table),
  );
  if (blocked.length > 0) {
    throw new Error(
      `Blocked table access for assistant intent "${intent}": ${blocked.join(', ')}`,
    );
  }

  const allowed = ASSISTANT_ALLOWED_TABLES[intent] ?? new Set<string>();
  const notAllowed = normalized.filter(
    (table) => !allowed.has(table) && !allowed.has(table.replace(/\./g, '_')),
  );

  if (notAllowed.length > 0) {
    throw new Error(
      `Assistant intent "${intent}" is not allowed to access table(s): ${notAllowed.join(', ')}`,
    );
  }
}
