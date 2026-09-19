import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { PermissionsService } from './permissions.service';

export const ALL_OUTLETS = 'ALL' as const;
export type AccessibleOutlets = number[] | typeof ALL_OUTLETS;

/**
 * Single source of truth for "which outlets can this user touch". Wraps
 * PermissionsService.getAccessibleOutletIds — which returns `null` for a
 * user with zero active role assignments and `[]` for a user whose
 * assignment(s) are all global/unscoped — so callers get one unambiguous
 * ALL_OUTLETS sentinel (or a genuinely empty list, meaning "no outlets")
 * instead of re-deriving that meaning themselves at each call site.
 */
@Injectable()
export class OutletAccessService {
  constructor(private readonly permissionsService: PermissionsService) {}

  async getAccessibleOutletIds(userId: number): Promise<AccessibleOutlets> {
    const outletIds =
      await this.permissionsService.getAccessibleOutletIds(userId);
    if (outletIds === null) {
      // Zero active role assignments — not "global", just no access.
      return [];
    }
    return outletIds;
  }

  async canAccessOutlet(userId: number, outletId: number): Promise<boolean> {
    const accessible = await this.getAccessibleOutletIds(userId);
    return accessible === ALL_OUTLETS || accessible.includes(outletId);
  }

  async assertOutletAccess(userId: number, outletId: number): Promise<void> {
    const allowed = await this.canAccessOutlet(userId, outletId);
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this outlet');
    }
  }

  /** Resolves a reporting request to one safe active outlet. */
  async resolveReportingOutlet(
    user: User,
    requestedOutletId?: number,
  ): Promise<number | undefined> {
    const accessible = await this.getAccessibleOutletIds(user.id);
    if (requestedOutletId !== undefined) {
      await this.assertOutletAccess(user.id, requestedOutletId);
      return requestedOutletId;
    }
    if (accessible === ALL_OUTLETS) return undefined;
    if (accessible.length === 0)
      throw new ForbiddenException('You do not have access to any outlet');
    return accessible[0];
  }

  assertSuperadmin(user: User): void {
    throw new ForbiddenException(
      'Control-plane operations are not available in the tenant API',
    );
  }
}
