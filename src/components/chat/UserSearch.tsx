
import React, { useEffect, useState } from 'react';
import { fetchUsers } from '@/components/user-management/UserOperations';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

interface UserSearchProps {
  onSelect: (user: User) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onSelect }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [term, setTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUsers();
        // fetchUsers already returns properly mapped User[] data
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users for search', error);
      }
    };
    load();
  }, []);

  const ROLE_PRIORITY: Record<User['role'], number> = {
    admin: 3,
    parish_coordinator: 2,
    roving_observer: 1,
    observer: 0,
  };

  const canMessage = (target: User) => {
    if (!user) return false;
    return ROLE_PRIORITY[user.role] >= ROLE_PRIORITY[target.role];
  };

  const filtered = users.filter(
    (u) =>
      u.id !== user?.id &&
      canMessage(u) &&
      (u.name.toLowerCase().includes(term.toLowerCase()) ||
        u.email.toLowerCase().includes(term.toLowerCase()))
  );

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search user..."
        className="border px-2 py-1 rounded w-full"
      />
      {term && (
        <ul className="absolute z-10 bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto">
          {filtered.map((u) => (
            <li
              key={u.id}
              onClick={() => {
                onSelect(u);
                setTerm('');
              }}
              className="px-2 py-1 cursor-pointer hover:bg-gray-100"
            >
              {u.name} ({u.role})
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-2 py-1 text-gray-500">No results</li>
          )}
        </ul>
      )}
    </div>
  );
};
