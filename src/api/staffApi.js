import { http } from './client'

/** Maps to Spring Boot:
 * GET    /api/admin/staff                       (admins + employees, role != 'user')
 * POST   /api/admin/staff/invite                 { fullName, mobile, email, role }
 * PATCH  /api/admin/staff/:id/role                { role }
 * PATCH  /api/admin/staff/:id/status              { status }  Active | Inactive
 * DELETE /api/admin/staff/:id
 * GET    /api/admin/staff/:id/permissions
 * PUT    /api/admin/staff/:id/permissions         { canManageProducts, canManageCustomers, canManageOrders, canManageCoupons, canViewReports, canManageDeliveryTax }
 * GET    /api/staff/my-permissions                (self-service, called by a logged-in employee's own dashboard)
 */
const staffApi = {
  list: () => http.get('/api/admin/staff'),

  invite: ({ fullName, mobile, email, role }) =>
    http.post('/api/admin/staff/invite', { fullName, mobile, email, role }),

  updateRole: (id, role) => http.patch(`/api/admin/staff/${id}/role`, { role }),

  updateStatus: (id, status) => http.patch(`/api/admin/staff/${id}/status`, { status }),

  remove: (id) => http.delete(`/api/admin/staff/${id}`),

  getPermissions: (id) => http.get(`/api/admin/staff/${id}/permissions`),

  updatePermissions: (id, permissions) => http.put(`/api/admin/staff/${id}/permissions`, permissions),

  myPermissions: () => http.get('/api/staff/my-permissions'),
}

export default staffApi
