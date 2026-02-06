'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

/**
 * HistoryDetailPage now redirects to ResultsPage
 * Analysis details are handled by /results/:id
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HistoryDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  useEffect(() => {
    if (id) {
      router.replace(`/results/${id}`);
    } else {
      router.replace('/history');
    }
  }, [id, router]);

  return null;
}
