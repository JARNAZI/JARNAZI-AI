import { createClient } from '@/lib/supabase/server';
import CreateStaffModal from './CreateStaffModal';
import UserListActions from './UserListActions';
import { getDictionary } from '@/i18n/get-dictionary';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const query = searchParams.q || '';

  let userQuery = supabase.from('profiles').select('*').order('created_at', { ascending: false });

  if (query) {
    userQuery = userQuery.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`);
  }

  const { data: users, error } = await userQuery.limit(50);

  if (error) {
    return <div className="p-8 text-destructive">Error: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">{dict.adminUsers?.title ?? 'User Management'}</h1>
        <CreateStaffModal />
      </div>

      <form className="mb-8" method="get">
        <div className="flex gap-2 max-w-md">
          <input
            name="q"
            defaultValue={query}
            placeholder={dict.adminUsers?.searchPlaceholder ?? 'Search by name or email...'}
            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="bg-primary px-4 py-2 rounded-lg text-primary-foreground hover:opacity-90">
            {dict.adminUsers?.searchButton ?? 'Search Users'}
          </button>
        </div>
      </form>

      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/40 text-muted-foreground text-sm">
            <tr>
              <th className="p-4">{dict.adminUsers?.thUser ?? 'User'}</th>
              <th className="p-4">{dict.adminUsers?.thRole ?? 'Role'}</th>
              <th className="p-4">{dict.adminUsers?.thTokens ?? 'Tokens'}</th>
              <th className="p-4">{dict.adminUsers?.thStatus ?? 'Status'}</th>
              <th className="p-4 text-right">{dict.adminUsers?.thActions ?? 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-foreground">{user.full_name || (dict.adminUsers?.noName ?? 'No Name')}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">{user.id}</div>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span
                    className={`px-2 py-0.5 rounded text-xs border ${user.role === 'admin' || user.role === 'super_admin'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-muted/40 text-muted-foreground border-border'
                      }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-foreground font-mono">{user.token_balance}</td>
                <td className="p-4">
                  {user.is_banned ? (
                    <span className="text-destructive text-xs bg-destructive/10 px-2 py-1 rounded">
                      {dict.adminUsers?.banned ?? 'Banned'}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded">
                      {dict.adminUsers?.active ?? 'Active'}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <UserListActions userId={user.id} userEmail={user.email || (dict.adminUsers?.noEmail ?? 'No Email')} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
