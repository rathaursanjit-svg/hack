import { Request, Response, NextFunction } from 'express';
import { queryOne } from '../db/database';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'retailer' | 'consumer';
  shopId?: string;
  supplierId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateDemoUser(req: Request, res: Response, next: NextFunction) {
  const userId = (req.headers['x-demo-user-id'] as string) || (req.query.demoUserId as string) || 'usr_con_1';

  try {
    const user = await queryOne<any>(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!user) {
      // Default fallback to consumer
      req.user = {
        id: 'usr_con_1',
        name: 'Aarav Mehta',
        email: 'aarav@customer.demo',
        role: 'consumer'
      };
      return next();
    }

    let shopId: string | undefined;
    let supplierId: string | undefined;

    if (user.role === 'retailer') {
      const shop = await queryOne<any>(`SELECT id FROM shops WHERE owner_user_id = ?`, [user.id]);
      shopId = shop?.id || 'shp_1';
    } else if (user.role === 'supplier') {
      const sup = await queryOne<any>(`SELECT id FROM suppliers WHERE user_id = ?`, [user.id]);
      supplierId = sup?.id || 'sup_1';
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopId,
      supplierId
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
}

export function requireRole(...allowedRoles: Array<'admin' | 'supplier' | 'retailer' | 'consumer'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient role permissions',
        requiredRoles: allowedRoles,
        currentRole: req.user?.role || 'anonymous'
      });
    }
    next();
  };
}
