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

  const initWeeklyReport = (root)=>{
    const users = {
      "20240901072": {password:"0000", role:"user"},
      "202513021024": {password:"0000", role:"user"},
      "202309021299": {password:"0000", role:"user"},
      "202513131209": {password:"0000", role:"user"},
      "202513131162": {password:"0000", role:"user"},
      "202513131180": {password:"0000", role:"user"},
      "202409131254": {password:"0000", role:"user"},
      "202413021006": {password:"0000", role:"user"},
      "admin": {password:"admin", role:"admin"}
    };
    const gate = $("[data-report-gate]", root);
    const userPanel = $("[data-user-panel]", root);
    const adminPanel = $("[data-admin-panel]", root);
    const uploadForm = $("[data-upload-form]", root);
    const reportList = $("[data-report-list]", root);
    const preview = $("[data-report-preview]", root);
    const reportCount = $("[data-report-count]", root);
    const dbName = "aio4cps-weekly-reports";
    const storeName = "reports";
    let currentUser = null;
    let activePreviewUrl = "";

    const setMessage = (el, text, type)=>{
      if(!el) return;
      el.textContent = text || "";
      el.classList.toggle("is-error", type === "error");
      el.classList.toggle("is-success", type === "success");
    };

    const openDb = ()=>new Promise((resolve, reject)=>{
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = ()=>{
        const db = request.result;
        if(!db.objectStoreNames.contains(storeName)){
          const store = db.createObjectStore(storeName, {keyPath:"id"});
          store.createIndex("uploadedAt", "uploadedAt");
        }
      };
      request.onsuccess = ()=>resolve(request.result);
      request.onerror = ()=>reject(request.error);
    });

    const dbAction = async (mode, action)=>{
      const db = await openDb();
      return new Promise((resolve, reject)=>{
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = action(store);
        request.onsuccess = ()=>resolve(request.result);
        request.onerror = ()=>reject(request.error);
        tx.oncomplete = ()=>db.close();
        tx.onerror = ()=>reject(tx.error);
      });
    };

    const saveReport = (report)=>dbAction("readwrite", store=>store.put(report));
    const getReport = (id)=>dbAction("readonly", store=>store.get(id));
    const getReports = ()=>dbAction("readonly", store=>store.getAll());

    const formatSize = (bytes)=>{
      if(bytes < 1024) return `${bytes} B`;
      if(bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    const escapeHtml = (value)=>String(value).replace(/[&<>"']/g, char=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[char]));

    const isAllowedFile = (file)=>{
      if(!file) return false;
      const name = file.name.toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
    };

    const showPanel = (account)=>{
      currentUser = account;
      const role = account.role;
      if(gate) gate.hidden = true;
      if(userPanel) userPanel.hidden = role !== "user";
      if(adminPanel) adminPanel.hidden = role !== "admin";
      $$("[data-current-user]", root).forEach(el=>{
        el.textContent = `${account.username} · ${role === "admin" ? "管理员" : "用户"}`;
      });
      const reportName = $("#reportName", root);
      if(reportName && role === "user") reportName.value = account.username;
      $$("[data-user-panel] .reveal, [data-admin-panel] .reveal", root).forEach(el=>el.classList.add("in"));
      if(role === "admin") renderReports();
    };

    const logout = ()=>{
      if(gate) gate.hidden = false;
      if(userPanel) userPanel.hidden = true;
      if(adminPanel) adminPanel.hidden = true;
      currentUser = null;
      if(activePreviewUrl){
        URL.revokeObjectURL(activePreviewUrl);
        activePreviewUrl = "";
      }
      if(preview) preview.innerHTML = '<div class="report-empty">请选择一份周报进行查看。</div>';
    };

    const loginForm = $("[data-report-login]", root);
    if(loginForm){
      loginForm.addEventListener("submit", (event)=>{
        event.preventDefault();
        const msg = $("[data-report-message]", loginForm);
        const username = String(new FormData(loginForm).get("username") || "").trim();
        const password = String(new FormData(loginForm).get("password") || "");
        const account = users[username];
        if(account && account.password === password){
          setMessage(msg, "登录成功。", "success");
          showPanel({username, role: account.role});
          loginForm.reset();
        }else{
          setMessage(msg, "用户名或密码不正确。", "error");
        }
      });
    }

    $$("[data-report-logout]", root).forEach(button=>{
      button.addEventListener("click", logout);
    });

    if(uploadForm){
      uploadForm.addEventListener("submit", async (event)=>{
        event.preventDefault();
        const msg = $("[data-upload-message]", uploadForm);
        const formData = new FormData(uploadForm);
        const name = currentUser && currentUser.role === "user" ? currentUser.username : String(formData.get("name") || "").trim();
        const week = String(formData.get("week") || "").trim();
        const file = formData.get("file");
        if(!name || !week || !(file instanceof File) || !file.name){
          setMessage(msg, "请填写姓名、周次并选择文件。", "error");
          return;
        }
        if(!isAllowedFile(file)){
          setMessage(msg, "仅支持 PDF、DOC、DOCX 格式。", "error");
          return;
        }
        try{
          await saveReport({
            id: (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`,
            name,
            username: name,
            week,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            data: await file.arrayBuffer()
          });
          uploadForm.reset();
          const reportName = $("#reportName", uploadForm);
          if(reportName && currentUser) reportName.value = currentUser.username;
          const weekSelect = $("#reportWeek", uploadForm);
          if(weekSelect) weekSelect.selectedIndex = 0;
          setMessage(msg, "周报已提交。", "success");
        }catch(error){
          setMessage(msg, "保存失败，请检查浏览器存储空间后重试。", "error");
        }
      });
    }

    const buildBlobUrl = (report)=>{
      const blob = new Blob([report.data], {type: report.fileType || "application/octet-stream"});
      return URL.createObjectURL(blob);
    };

    const downloadReport = async (id)=>{
      const report = await getReport(id);
      if(!report) return;
      const url = buildBlobUrl(report);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.name}-${report.week}-${report.fileName}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url), 1000);
    };

    const previewReport = async (id)=>{
      const report = await getReport(id);
      if(!report || !preview) return;
      if(activePreviewUrl) URL.revokeObjectURL(activePreviewUrl);
      activePreviewUrl = buildBlobUrl(report);
      const lowerName = report.fileName.toLowerCase();
      if(lowerName.endsWith(".pdf")){
        preview.innerHTML = `<iframe title="${escapeHtml(report.fileName)}" src="${activePreviewUrl}"></iframe>`;
      }else{
        preview.innerHTML = `
          <div class="report-preview-card">
            <strong>${escapeHtml(report.fileName)}</strong>
            <span>${escapeHtml(report.name)} · ${escapeHtml(report.week)} · ${formatSize(report.fileSize)}</span>
            <span>Word 文件受浏览器能力限制，通常需要下载后使用 Word 或 WPS 查看。</span>
            <button class="btn-primary" data-download-current="${report.id}" type="button">下载文件</button>
          </div>`;
      }
    };

    const renderReports = async ()=>{
      if(!reportList) return;
      const reports = (await getReports()).sort((a, b)=>String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
      if(!reports.length){
        reportList.innerHTML = '<div class="report-empty">暂无周报记录。</div>';
        if(reportCount) reportCount.textContent = "0";
        return;
      }
      if(reportCount) reportCount.textContent = String(reports.length);
      reportList.innerHTML = reports.map(report=>{
        const uploaded = new Date(report.uploadedAt).toLocaleString("zh-CN", {hour12:false});
        return `
          <div class="report-item" data-report-id="${report.id}">
            <div class="report-item-head">
              <div>
                <div class="report-item-title">${escapeHtml(report.name)}</div>
                <div class="report-item-meta">
                  <span>${escapeHtml(report.week)}</span>
                  <span>${escapeHtml(report.fileName)} · ${formatSize(report.fileSize)}</span>
                  <span>${uploaded}</span>
                </div>
              </div>
            </div>
            <div class="report-item-actions">
              <button class="btn-secondary" data-preview-report="${report.id}" type="button">在线查看</button>
              <button class="btn-primary" data-download-report="${report.id}" type="button">下载</button>
            </div>
          </div>`;
      }).join("");
    };

    root.addEventListener("click", (event)=>{
      const previewButton = event.target.closest("[data-preview-report]");
      const downloadButton = event.target.closest("[data-download-report], [data-download-current]");
      if(previewButton) previewReport(previewButton.dataset.previewReport);
      if(downloadButton) downloadReport(downloadButton.dataset.downloadReport || downloadButton.dataset.downloadCurrent);
    });
  };

  $$("[data-weekly-report]").forEach(initWeeklyReport);
  $$("[data-carousel]").forEach(initCarousel);
})();
