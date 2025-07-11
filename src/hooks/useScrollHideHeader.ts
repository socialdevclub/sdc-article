import { useState, useEffect } from "react";

export const useScrollHideHeader = (threshold = 100) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 스크롤이 threshold를 넘지 않으면 항상 보이게
      if (currentScrollY < threshold) {
        setIsVisible(true);
      } else {
        // 스크롤 내리면 숨김, 스크롤 올리면 보임
        if (currentScrollY > lastScrollY) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, threshold]);

  return isVisible;
}; 