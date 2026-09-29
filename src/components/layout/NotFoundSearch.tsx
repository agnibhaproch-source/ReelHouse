'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export function NotFoundSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      className="w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Input variant="search" type="search" label="Search movies" placeholder="Search for a title, actor or director" value={q} onChange={(e) => setQ(e.currentTarget.value)} icon={<Search />} />
    </form>
  );
}
