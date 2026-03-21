declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    rdt?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const REDDIT_PIXEL_ID = import.meta.env.VITE_REDDIT_PIXEL_ID as string | undefined;

function gtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
}

function rdt(...args: any[]) {
  if (typeof window !== "undefined" && window.rdt) {
    window.rdt(...args);
  }
}

export function trackPageView(path: string) {
  if (GA4_ID) {
    gtag("event", "page_view", { page_path: path });
  }
  if (META_PIXEL_ID) {
    fbq("track", "PageView");
  }
  if (REDDIT_PIXEL_ID) {
    rdt("track", "PageVisit");
  }
}

export function trackSignupStart() {
  if (GA4_ID) {
    gtag("event", "signup_start");
  }
  if (META_PIXEL_ID) {
    fbq("track", "Lead");
  }
}

export function trackSignupComplete() {
  if (GA4_ID) {
    gtag("event", "signup_complete");
  }
  if (META_PIXEL_ID) {
    fbq("track", "Purchase", { value: 99, currency: "USD" });
  }
  if (REDDIT_PIXEL_ID) {
    rdt("track", "SignUp");
    rdt("track", "Purchase", { value: 99, currency: "USD" });
  }
}

export function trackLogin() {
  if (GA4_ID) {
    gtag("event", "login");
  }
}

export function trackRxSubmitted() {
  if (GA4_ID) {
    gtag("event", "rx_submitted");
  }
}

export function useAnalytics() {
  return {
    trackPageView,
    trackSignupStart,
    trackSignupComplete,
    trackLogin,
    trackRxSubmitted,
  };
}
