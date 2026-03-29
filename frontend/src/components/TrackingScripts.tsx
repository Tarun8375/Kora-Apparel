'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * TrackingScripts — Client component that reads settings and injects
 * Facebook Pixel, Google Analytics 4, and GTM scripts into the page.
 * Rendered server-side on every page via the root layout.
 */
export default function TrackingScripts() {
  const { data: settings, isError } = useQuery({
    queryKey: ['tracking-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry during build
  });

  if (!settings || isError) return null;

  const { fbPixelId, fbPixelEnabled, gaId, gaEnabled, gtmId, gtmEnabled } = settings;

  return (
    <>
      {/* ── Facebook Pixel ── */}
      {fbPixelEnabled && fbPixelId && (
        <>
          <script
            key="fb-script"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixelId}');
                fbq('track', 'PageView');
              `
            }}
          />
          <noscript key="fb-noscript">
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* ── Google Analytics 4 ── */}
      {gaEnabled && gaId && (
        <>
          <script key="ga-src" async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          <script
            key="ga-inline"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `
            }}
          />
        </>
      )}

      {/* ── Google Tag Manager ── */}
      {gtmEnabled && gtmId && (
        <>
          <script
            key="gtm-script"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `
            }}
          />
          <noscript
            key="gtm-noscript"
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
            }}
          />
        </>
      )}
    </>
  );
}
