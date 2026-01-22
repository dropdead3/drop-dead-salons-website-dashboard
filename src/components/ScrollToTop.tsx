import { useEffect, useRef, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  // Disable browser's automatic scroll restoration
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const wasDashboard = prevPathname.current.startsWith('/dashboard');
    const isDashboard = pathname.startsWith('/dashboard');
    
    // Don't scroll to top when navigating within the dashboard
    if (!(wasDashboard && isDashboard)) {
      window.scrollTo(0, 0);
    }
    
    prevPathname.current = pathname;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
