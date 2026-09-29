'use client';

import { useRef, useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { toast } from '@/stores/toast';
import { isReducedNow } from '@/hooks/useMotionPrefs';
import { Button } from '@/components/ui/Button';

/** Share: icon shoots up; native share sheet or "Link copied" toast; icon morphs to a check for 1.5s. */
export function ShareButton({ title }: { title: string }) {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const svg = ref.current?.querySelector('svg');
    if (svg && !isReducedNow())
      gsap.fromTo(
        svg,
        { y: 0 },
        { y: -10, opacity: 0, duration: 0.25, ease: 'shutter', yoyo: true, repeat: 1 },
      );
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success('Link copied');
    } catch {
      /* cancelled */
    }
  };
  return (
    <Button
      ref={ref}
      variant="icon"
      size="lg"
      label={copied ? 'Link copied' : `Share ${title}`}
      icon={copied ? <Check /> : <Share2 />}
      iconAnim="share"
      onClick={() => void share()}
    />
  );
}
