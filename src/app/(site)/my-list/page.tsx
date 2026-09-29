import type { Metadata } from 'next';
import { MyList } from '@/components/movie/MyList';

export const metadata: Metadata = { title: 'My list', robots: { index: false } };

export default function MyListPage() {
  return <MyList />;
}
