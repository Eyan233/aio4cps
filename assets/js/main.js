(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // Mobile menu
  const hamb = $("#hamburger");
  const mobile = $("#mobileNav");
  if(hamb && mobile){
    hamb.addEventListener("click", ()=>{
      const open = mobile.style.display === "block";
      mobile.style.display = open ? "none" : "block";
      hamb.setAttribute("aria-expanded", String(!open));
    });
  }

  // Reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    for(const e of entries){
      if(e.isIntersecting){
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  }, {threshold: 0.12});
  $$(".reveal").forEach(el=>io.observe(el));

  // Active nav highlighting
  const here = location.pathname.split("/").pop() || "index.html";
  $$(`a[data-page]`).forEach(a=>{
    if(a.getAttribute("data-page") === here) a.classList.add("active");
  });

  // Smooth anchor for same-page hash
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",(ev)=>{
      const id = a.getAttribute("href");
      const target = $(id);
      if(target){
        ev.preventDefault();
        target.scrollIntoView({behavior:"smooth", block:"start"});
        history.replaceState(null, "", id);
      }
    });
  });

  // Subtle parallax for hero glow
  const glow = $("#heroGlow");
  if(glow){
    window.addEventListener("mousemove",(e)=>{
      const x = (e.clientX / window.innerWidth - .5) * 18;
      const y = (e.clientY / window.innerHeight - .5) * 12;
      glow.style.transform = `translate(${x}px, ${y}px)`;
    }, {passive:true});
  }
})();
