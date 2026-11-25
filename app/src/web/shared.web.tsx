import { type ReactNode } from 'react';
import { Image } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSession } from '../services/session';
import { roleNames } from '../domain/tickets';
import './portal.css';
import logo from '../../assets/alianza-logo.png';
export { roleNames };
export function Logo() { return <Image accessibilityLabel="Alianza Informática" source={logo} style={{ width: 46, height: 46, backgroundColor: '#fff', borderRadius: 10 }} resizeMode="contain" />; }
export function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = { home: 'M3 11 12 4l9 7v9H3z', services: 'M5 7h14M5 12h14M5 17h9', new: 'M12 5v14M5 12h14', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', profile: 'M20 21a8 8 0 1 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10', search: 'M21 21l-4-4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0', chev: 'M9 18l6-6-6-6' };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name] || paths.services} /></svg>;
}
export function Status({ children }: { children: string }) { return <span className={`status ${children.toLowerCase().replaceAll(' ', '-')}`}>{children}</span>; }
export function Field({ label, value, onChange, wide = false, read = false, multiline = false, type = 'text', required = false }: { label: string; value: string; onChange?(v: string): void; wide?: boolean; read?: boolean; multiline?: boolean; type?: string; required?: boolean }) {
  return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}{required ? ' *' : ''}</span>{multiline ? <textarea value={value} readOnly={read} onChange={e => onChange?.(e.target.value)} maxLength={4000} required={required} /> : <input value={value} readOnly={read} onChange={e => onChange?.(e.target.value)} type={type} maxLength={4000} required={required} />}</label>;
}
export function Choices({ label, options, value, onChange, multiple = false, disabled = false }: { label: string; options: readonly string[]; value: string; onChange(v: string): void; multiple?: boolean; disabled?: boolean }) {
  return <fieldset className="choice-group"><legend className="subhead">{label}</legend><div className="choices">{options.map(option => <label key={option}><input type={multiple ? 'checkbox' : 'radio'} name={label} disabled={disabled} checked={value.split('|').includes(option)} onChange={() => onChange(multiple ? (value.split('|').includes(option) ? value.split('|').filter(x => x !== option) : [...value.split('|').filter(Boolean), option]).join('|') : option)} /><span>{option}</span></label>)}</div></fieldset>;
}
export function Title({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children?: ReactNode }) { return <div className="page-title"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{children}</div>; }
export function Shell({ children, demo = false }: { children: ReactNode; demo?: boolean }) {
  const session = useSession();
  const pathname = usePathname();
  const role = session.membership?.role;
  const name = demo ? 'Vista de diseño' : session.membership?.name || session.user?.email || 'Mi cuenta';
  const nav = !demo && !session.membership
    ? [{ path: '/users', icon: 'users', label: 'Usuarios y permisos' }]
    : [{ path: '/dashboard', icon: 'home', label: 'Inicio' }, { path: '/tickets', icon: 'services', label: 'Servicios' }, ...(role !== 'technician' ? [{ path: '/tickets/new', icon: 'new', label: 'Nuevo reporte' }] : []), ...(session.canManageAccess || role === 'admin' ? [{ path: '/users', icon: 'users', label: 'Usuarios y permisos' }] : []), { path: '/profile', icon: 'profile', label: 'Perfil y seguridad' }];
  const go = (path: string) => router.push(path as '/tickets');
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><Logo /><div><strong>Alianza</strong><span>Servicios</span></div></div><div className="company"><small>Empresa activa</small><strong>{demo ? 'Demostración local' : session.membership ? (session.companyNames[session.membership.tenantId] || session.membership.tenantId) : 'Administración de accesos'}</strong></div><nav>{nav.map(item => <button key={item.path} className={pathname === item.path ? 'active' : ''} onClick={() => go(demo ? '/' : item.path)}><Icon name={item.icon} />{item.label}</button>)}</nav><div className="side-bottom"><div className="role"><span className="avatar">{name.slice(0, 2).toUpperCase()}</span><span><strong>{name}</strong><small>{demo ? 'Sin conexión' : role ? roleNames[role] : 'Pendiente de activación'}</small></span></div><button className="logout" onClick={() => { if (demo) go('/'); else void session.logout().then(() => go('/')); }}>{demo ? 'Volver al acceso' : 'Cerrar sesión'}</button></div></aside><main><header className="topbar"><button className="mobile-brand" onClick={() => go(demo ? '/' : session.membership ? '/dashboard' : '/users')}><Logo />Alianza Servicios</button><span className="desktop-heading">Gestión de servicios</span><span className="environment">{demo ? 'Vista previa · datos temporales' : 'Versión de prueba'}</span></header><div className="content">{children}</div></main><nav className="bottom-nav">{nav.filter(n => n.path !== '/users' || !session.membership).map(item => <button key={item.path} className={pathname === item.path ? 'active' : ''} onClick={() => go(demo ? '/' : item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav></div>;
}
