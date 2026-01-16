import { createClient } from '@/lib/supabase/server';
import CreateStaffModal from './CreateStaffModal';
import UserListActions from './UserListActions';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage(props: {    searchParams: Promise<{ q?: string }>
}) {    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const query = searchParams.q || '';

    let userQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (query) {
        userQuery = userQuery.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`);
    }

    const { data: users, error } = await userQuery.limit(50);

    if (error) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <CreateStaffModal />
            </div>

            {/* Search Bar */}
            <form className="mb-8" method="get">
                <div className="flex gap-2 max-w-md">
                    <input
                        name="q"
                        defaultValue={query}
                        placeholder="Search by name or email..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button type="submit" className="bg-indigo-600 px-4 py-2 rounded-lg text-white hover:bg-indigo-500">Search Users</button>
                </div>
            </form>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-gray-400 text-sm">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Tokens</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users?.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="font-medium text-white">{user.full_name || 'No Name'}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                    <div className="text-xs text-gray-600 font-mono mt-1">{user.id}</div>
                                </td>
                                <td className="p-4 text-gray-300">
                                    <span className={`px-2 py-0.5 rounded text-xs border ${user.role === 'admin' || user.role === 'super_admin'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-white font-mono">{user.token_balance}</td>
                                <td className="p-4">
                                    {user.is_banned ? (
                                        <span className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">Banned</span>
                                    ) : (
                                        <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded">Active</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <UserListActions userId={user.id} userEmail={user.email || 'No Email'} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
