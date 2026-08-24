// Every "where does this role land after login / if they wander somewhere
// that isn't theirs" check in the app funnels through here, so adding a new
// role's home area (like delivery_partner) is a one-place change instead of
// hunting down every ternary that used to just check admin/employee vs not.
export function homePathForRole(role) {
  if (role === 'admin' || role === 'employee') return '/admin'
  if (role === 'delivery_partner') return '/delivery'
  return '/dashboard'
}
