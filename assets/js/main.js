(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hamb = $("#hamburger");
  const mobile = $("#mobileNav");
  const isMobileView = () => window.matchMedia("(max-width: 640px)").matches;

  const setMenu = (open) => {
    if(!mobile || !hamb) return;
    mobile.hidden = !open;
    hamb.setAttribute("aria-expanded", String(open));
  };

  if(hamb && mobile){
    mobile.hidden = true;
    hamb.addEventListener("click", (event)=>{
      event.stopPropagation();
      setMenu(mobile.hidden);
    });

    mobile.addEventListener("click", (event)=>{
      if(event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", (event)=>{
      if(!mobile.hidden && !mobile.contains(event.target) && event.target !== hamb){
        setMenu(false);
      }
    });

    document.addEventListener("keydown", (event)=>{
      if(event.key === "Escape" && !mobile.hidden){
        setMenu(false);
        hamb.focus();
      }
    });

    window.addEventListener("resize", ()=>{
      if(!isMobileView()) setMenu(false);
    });
  }

  if("IntersectionObserver" in window){
    const io = new IntersectionObserver((entries)=>{
      for(const e of entries){
        if(e.isIntersecting){
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    }, {threshold: 0.12});
    $$(".reveal").forEach(el=>io.observe(el));
  }else{
    $$(".reveal").forEach(el=>el.classList.add("in"));
  }

  const here = location.pathname.split("/").pop() || "index.html";
  $$("a[data-page]").forEach(a=>{
    if(a.getAttribute("data-page") === here) a.classList.add("active");
  });

  const openDetailsForTarget = (target)=>{
    if(!target) return;
    const details = target.matches && target.matches('details') ? target : target.closest('details');
    if(details) details.open = true;
  };

  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",(ev)=>{
      const id = a.getAttribute("href");
      const target = $(id);
      if(target){
        ev.preventDefault();
        openDetailsForTarget(target);
        target.scrollIntoView({behavior:"smooth", block:"start"});
        history.replaceState(null, "", id);
      }
    });
  });

  $$("[data-current-year]").forEach(el=>{
    el.textContent = String(new Date().getFullYear());
  });


  const hashTarget = location.hash ? document.querySelector(location.hash) : null;
  if(hashTarget){
    const details = hashTarget.matches && hashTarget.matches('details') ? hashTarget : hashTarget.closest("details");
    if(details) details.open = true;
  }

  $$('[data-href]').forEach(el=>{
    const go = ()=>{
      const href = el.dataset.href;
      if(href) window.location.href = href;
    };
    el.addEventListener('click', (event)=>{
      if(event.target.closest('a,button')) return;
      go();
    });
    el.addEventListener('keydown', (event)=>{
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        go();
      }
    });
  });

  const animateCounter = (el)=>{
    if(el.dataset.animated === "true") return;
    const target = Number(el.dataset.counter || el.textContent.replace(/[^\d.]/g, ""));
    const suffix = el.dataset.counterSuffix || "";
    if(!Number.isFinite(target)) return;
    el.dataset.animated = "true";
    if(reducedMotion){
      el.textContent = `${target}${suffix}`;
      return;
    }
    const duration = 1200;
    const startAt = performance.now();
    const step = (now)=>{
      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${value}${suffix}`;
      if(progress < 1) requestAnimationFrame(step);
      else el.textContent = `${target}${suffix}`;
    };
    requestAnimationFrame(step);
  };

  const counterEls = $$('[data-counter]');
  if(counterEls.length){
    if("IntersectionObserver" in window){
      const counterObserver = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, {threshold: 0.45});
      counterEls.forEach(el=>counterObserver.observe(el));
    }else{
      counterEls.forEach(animateCounter);
    }
  }

  const initCarousel = (root)=>{
    const slides = $$("[data-carousel-slide]", root);
    const dots = $$("[data-carousel-dot]", root);
    if(slides.length <= 1) return;

    let index = 0;
    let timer = null;
    const interval = Number(root.dataset.interval || 5200);

    const clearLeaving = ()=>{
      slides.forEach(slide=>slide.classList.remove("leaving"));
    };

    const show = (next)=>{
      const prev = index;
      index = (next + slides.length) % slides.length;
      if(prev !== index){
        slides[prev].classList.remove("active");
        slides[prev].classList.add("leaving");
        window.setTimeout(()=>{
          slides[prev].classList.remove("leaving");
        }, 650);
      }
      slides.forEach((slide, i)=>{
        const active = i === index;
        slide.classList.toggle("active", active);
        slide.setAttribute("aria-hidden", String(!active));
        if(active) slide.classList.remove("leaving");
      });
      dots.forEach((dot, i)=>{
        const active = i === index;
        dot.classList.toggle("active", active);
        if(dot.tagName === "A") {
          if(active) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        } else {
          dot.setAttribute("aria-selected", String(active));
        }
      });
    };

    const stop = ()=>{
      if(timer){
        window.clearInterval(timer);
        timer = null;
      }
    };

    const start = ()=>{
      if(reducedMotion) return;
      stop();
      timer = window.setInterval(()=>show(index + 1), interval);
    };

    dots.forEach((dot, i)=>{
      const preview = ()=>{
        clearLeaving();
        show(i);
      };
      if(dot.tagName === "A") {
        dot.addEventListener("mouseenter", ()=>{
          preview();
          stop();
        });
        dot.addEventListener("focus", ()=>{
          preview();
          stop();
        });
      } else {
        dot.addEventListener("click", (event)=>{
          if(event) event.preventDefault();
          preview();
          start();
        });
      }
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    let startX = null;
    root.addEventListener("touchstart", (e)=>{
      if(e.touches && e.touches[0]) startX = e.touches[0].clientX;
      stop();
    }, {passive:true});

    root.addEventListener("touchend", (e)=>{
      if(startX == null) return;
      const endX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : startX;
      const delta = endX - startX;
      if(Math.abs(delta) > 36){
        clearLeaving();
        show(index + (delta < 0 ? 1 : -1));
      }
      startX = null;
      start();
    }, {passive:true});

    show(0);
    start();
  };

  $$("[data-carousel]").forEach(initCarousel);
})();
