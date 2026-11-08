// Public account identifier explicitly chosen by the site owner. Never a password or client-supplied role.
export const PROFESSOR_EMAIL = 'santana.lourenco@gmail.com';
export function isProfessor(user) {
  return user?.role === 'professor' && user.email === PROFESSOR_EMAIL && Boolean(user.google_sub);
}
