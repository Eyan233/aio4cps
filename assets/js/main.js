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
      "20240901072": {password:"0000", role:"user", name:"苏章圣", college:"材料科学与工程", major:"冶金工程", entryYear:"2024", phone:"15987963968", email:"1253296002@qq.com"},
      "202513021024": {password:"0000", role:"user", name:"皮景升", college:"自动化学院", major:"控制科学与工程", entryYear:"2025", phone:"19562171350", email:"3137165096@qq.com"},
      "202309021299": {password:"0000", role:"user", name:"孙禄冰", college:"材料科学与工程", major:"冶金工程", entryYear:"2023", phone:"13062320535", email:"1255996389@qq.com"},
      "202513131209": {password:"0000", role:"user", name:"蒋卓隽", college:"自动化学院", major:"电子信息", entryYear:"2025", phone:"13629647969", email:"2515193390@qq.com"},
      "202513131162": {password:"0000", role:"user", name:"陈佳玲", college:"自动化学院", major:"电子信息", entryYear:"2025", phone:"17775609276", email:"2985078918@qq.com"},
      "202513131180": {password:"0000", role:"user", name:"张富均", college:"自动化学院", major:"电子信息", entryYear:"2025", phone:"15923858308", email:"15923858308@163.com"},
      "202409131254": {password:"0000", role:"user", name:"罗庆暄", college:"材料科学与工程", major:"材料与化工", entryYear:"2024", phone:"17783598675", email:"709235262@qq.com"},
      "202413021006": {password:"0000", role:"user", name:"刘涛", college:"自动化学院", major:"控制科学与工程", entryYear:"2024", phone:"19855816903", email:"19855816903@163.com"},
      "admin": {password:"admin", role:"admin"}
    };
    const gate = $("[data-report-gate]", root);
    const userPanel = $("[data-user-panel]", root);
    const adminPanel = $("[data-admin-panel]", root);
    const uploadForm = $("[data-upload-form]", root);
    const profileForm = $("[data-profile-form]", root);
    const reportList = $("[data-report-list]", root);
    const userHistory = $("[data-user-history]", root);
    const preview = $("[data-report-preview]", root);
    const reportCount = $("[data-report-count]", root);
    const selectedCount = $("[data-selected-count]", root);
    const uploadMask = $("[data-upload-mask]", root);
    const filterName = $("[data-filter-name]", root);
    const filterWeek = $("[data-filter-week]", root);
    const progressSummary = $("[data-progress-summary]", root);
    const progressBar = $("[data-progress-bar]", root);
    const progressList = $("[data-progress-list]", root);
    const adminUserForm = $("[data-admin-user-form]", root);
    const userList = $("[data-user-list]", root);
    const reportApiBase = window.AIO4CPS_REPORT_API || "";
    let currentUser = null;
    let cachedReports = [];
    let cloudUsers = [];

    const setMessage = (el, text, type)=>{
      if(!el) return;
      el.textContent = text || "";
      el.classList.toggle("is-error", type === "error");
      el.classList.toggle("is-success", type === "success");
    };

    const setUploading = (uploading)=>{
      if(uploadMask) uploadMask.hidden = !uploading;
      if(uploadForm){
        $$("input,select,button", uploadForm).forEach(control=>{
          control.disabled = uploading;
        });
      }
    };

    const apiUrl = (path)=>`${reportApiBase.replace(/\/$/, "")}${path}`;

    const ensureReportApi = ()=>{
      if(!reportApiBase){
        throw new Error("未配置服务器存储接口。GitHub Pages 纯静态页面不能直接接收跨设备上传，请配置后端接口或 GitHub 仓库存储服务。");
      }
    };

    const requestJson = async (path, options={})=>{
      ensureReportApi();
      const response = await fetch(apiUrl(path), options);
      if(!response.ok) throw new Error(`请求失败：${response.status}`);
      if(response.status === 204) return {};
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    };

    const saveReport = async (report)=>{
      ensureReportApi();
      const formData = new FormData();
      Object.entries(report.meta).forEach(([key, value])=>formData.append(key, value));
      formData.append("file", report.file);
      const response = await fetch(apiUrl("/reports"), {method:"POST", body:formData});
      if(!response.ok) throw new Error(`上传失败：${response.status}`);
      return response.json();
    };

    const getReport = async (id)=>{
      const reports = await getReports();
      return reports.find(report=>String(report.id) === String(id));
    };

    const getReports = async ()=>{
      if(!reportApiBase) return [];
      const data = await requestJson("/reports");
      return Array.isArray(data) ? data : (data.reports || []);
    };

    const deleteReport = async (id)=>requestJson(`/reports/${encodeURIComponent(id)}`, {method:"DELETE"});

    const normalizeUser = (username, profile={})=>({
      username,
      password: profile.password || "0000",
      role: profile.role || "user",
      displayName: profile.displayName || profile.name || username,
      name: profile.displayName || profile.name || username,
      college: profile.college || "",
      major: profile.major || "",
      entryYear: profile.entryYear || profile.entry_year || "",
      phone: profile.phone || "",
      email: profile.email || ""
    });

    const defaultUserRows = ()=>Object.entries(users)
      .filter(([, profile])=>profile.role === "user")
      .map(([username, profile])=>normalizeUser(username, profile));

    const getCloudUsers = async ()=>{
      if(!reportApiBase) return defaultUserRows();
      try{
        const data = await requestJson("/users");
        const rows = Array.isArray(data) ? data : (data.users || []);
        cloudUsers = rows.map(row=>normalizeUser(row.username || row.studentId, row)).filter(row=>row.username);
        if(userList) delete userList.dataset.userError;
      }catch(error){
        cloudUsers = defaultUserRows();
        if(userList) userList.dataset.userError = error.message || "用户接口不可用";
      }
      return cloudUsers.length ? cloudUsers : defaultUserRows();
    };

    const getUserProfile = async (username)=>{
      const rows = await getCloudUsers();
      return rows.find(row=>row.username === username) || normalizeUser(username, users[username] || {});
    };

    const saveCloudUser = async (profile)=>{
      saveProfile(profile.username, profile);
      const existing = users[profile.username] || {};
      users[profile.username] = {...existing, ...profile, name: profile.displayName || profile.name || profile.username, role: profile.role || existing.role || "user"};
      if(!reportApiBase) return {localOnly:true};
      return requestJson("/users", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(profile)
      });
    };

    const deleteCloudUser = async (username)=>{
      delete users[username];
      localStorage.removeItem(profileKey(username));
      if(!reportApiBase) return {localOnly:true};
      return requestJson(`/users/${encodeURIComponent(username)}`, {method:"DELETE"});
    };

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

    const profileKey = (username)=>`aio4cps-profile-${username}`;

    const getProfile = (username)=>{
      const cloudProfile = cloudUsers.find(row=>row.username === username);
      const defaults = cloudProfile || users[username] || {};
      try{
        return {...defaults, ...JSON.parse(localStorage.getItem(profileKey(username)) || "{}")};
      }catch(error){
        return {...defaults};
      }
    };

    const saveProfile = (username, profile)=>{
      localStorage.setItem(profileKey(username), JSON.stringify(profile));
    };

    const getDisplayName = (username)=>{
      const profile = getProfile(username);
      return profile.displayName || profile.name || username;
    };

    const updateCurrentUserText = ()=>{
      if(!currentUser) return;
      $$("[data-current-user]", root).forEach(el=>{
        const roleText = currentUser.role === "admin" ? "管理员" : "用户";
        const nameText = currentUser.role === "admin" ? currentUser.username : `${getDisplayName(currentUser.username)} · ${currentUser.username}`;
        el.textContent = `${nameText} · ${roleText}`;
      });
    };

    const isAllowedFile = (file)=>{
      if(!file) return false;
      const name = file.name.toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
    };

    const getWeekNumber = (week)=>{
      const match = String(week).match(/第(\d+)周/);
      return match ? match[1] : "0";
    };

    const reportIdFor = (username, week)=>`${username}-week-${getWeekNumber(week)}`;

    const getVisibleReports = (reports)=>{
      const latest = new Map();
      reports.forEach(report=>{
        const key = `${report.username || report.name}|${report.week}`;
        const current = latest.get(key);
        if(!current || String(report.uploadedAt).localeCompare(String(current.uploadedAt)) > 0){
          latest.set(key, report);
        }
      });
      return Array.from(latest.values()).sort((a, b)=>String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
    };

    const showPanel = async (account)=>{
      currentUser = account;
      const role = account.role;
      if(gate) gate.hidden = true;
      if(userPanel) userPanel.hidden = role !== "user";
      if(adminPanel) adminPanel.hidden = role !== "admin";
      document.body.classList.add("affairs-authenticated");
      if(role === "user") await getUserProfile(account.username);
      if(role === "admin") await getCloudUsers();
      updateCurrentUserText();
      const reportName = $("#reportName", root);
      if(reportName && role === "user") reportName.value = getDisplayName(account.username);
      if(role === "user"){
        const profile = getProfile(account.username);
        const profileFields = {
          displayName: profile.displayName || profile.name || "",
          college: profile.college || "",
          major: profile.major || "",
          entryYear: profile.entryYear || "",
          studentId: account.username,
          phone: profile.phone || "",
          email: profile.email || ""
        };
        Object.entries(profileFields).forEach(([key, value])=>{
          const input = $(`[name="${key}"]`, root);
          if(input) input.value = value;
        });
      }
      $$("[data-user-panel] .reveal, [data-admin-panel] .reveal", root).forEach(el=>el.classList.add("in"));
      if(role === "user") renderUserHistory();
      if(role === "admin"){
        renderReports();
        renderUsers();
      }
      window.scrollTo({top:0, behavior:"smooth"});
    };

    const logout = ()=>{
      if(gate) gate.hidden = false;
      if(userPanel) userPanel.hidden = true;
      if(adminPanel) adminPanel.hidden = true;
      document.body.classList.remove("affairs-authenticated");
      currentUser = null;
      if(preview) preview.innerHTML = '<div class="report-empty">在线查看会在新标签页打开 PDF。</div>';
      window.scrollTo({top:0, behavior:"smooth"});
    };

    const loginForm = $("[data-report-login]", root);
    if(loginForm){
      loginForm.addEventListener("submit", async (event)=>{
        event.preventDefault();
        const msg = $("[data-report-message]", loginForm);
        const username = String(new FormData(loginForm).get("username") || "").trim();
        const password = String(new FormData(loginForm).get("password") || "");
        const account = users[username];
        if(account && account.password === password){
          setMessage(msg, "登录成功。", "success");
          await showPanel({username, role: account.role});
          loginForm.reset();
        }else{
          setMessage(msg, "用户名或密码不正确。", "error");
        }
      });
    }

    $$("[data-report-logout]", root).forEach(button=>{
      button.addEventListener("click", logout);
    });

    if(profileForm){
      profileForm.addEventListener("submit", async (event)=>{
        event.preventDefault();
        if(!currentUser || currentUser.role !== "user") return;
        const msg = $("[data-profile-message]", profileForm);
        const formData = new FormData(profileForm);
        const profile = {
          displayName: String(formData.get("displayName") || "").trim(),
          college: String(formData.get("college") || "").trim(),
          major: String(formData.get("major") || "").trim(),
          entryYear: String(formData.get("entryYear") || "").trim(),
          phone: String(formData.get("phone") || "").trim(),
          email: String(formData.get("email") || "").trim()
        };
        try{
          await saveCloudUser({username:currentUser.username, role:"user", password:"0000", ...profile});
          await getCloudUsers();
          updateCurrentUserText();
          const reportName = $("#reportName", root);
          if(reportName) reportName.value = getDisplayName(currentUser.username);
          setMessage(msg, "个人资料已保存到云端。", "success");
        }catch(error){
          setMessage(msg, `保存失败：${error.message || "请检查云端用户接口"}`, "error");
        }
      });
    }

    if(uploadForm){
      uploadForm.addEventListener("submit", async (event)=>{
        event.preventDefault();
        const msg = $("[data-upload-message]", uploadForm);
        const formData = new FormData(uploadForm);
        const username = currentUser && currentUser.role === "user" ? currentUser.username : String(formData.get("name") || "").trim();
        const profile = currentUser && currentUser.role === "user" ? getProfile(currentUser.username) : {};
        const name = currentUser && currentUser.role === "user" ? getDisplayName(currentUser.username) : username;
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
          setUploading(true);
          const result = await saveReport({
            meta: {
              id: reportIdFor(username, week),
              name,
              username,
              displayName: name,
              college: profile.college || "",
              major: profile.major || "",
              entryYear: profile.entryYear || "",
              phone: profile.phone || "",
              email: profile.email || "",
              week,
              fileName: file.name,
              fileType: file.type || "application/octet-stream",
              fileSize: String(file.size),
              uploadedAt: new Date().toISOString()
            },
            file
          });
          uploadForm.reset();
          const reportName = $("#reportName", uploadForm);
          if(reportName && currentUser) reportName.value = getDisplayName(currentUser.username);
          const weekSelect = $("#reportWeek", uploadForm);
          if(weekSelect) weekSelect.selectedIndex = 0;
          setMessage(msg, result.replaced ? "已覆盖该周原周报。" : "周报已提交。", "success");
          await renderUserHistory();
        }catch(error){
          setMessage(msg, error.message || "保存失败，请检查服务器存储接口后重试。", "error");
        }finally{
          setUploading(false);
        }
      });
    }

    const safeFileName = (value)=>String(value).replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();

    const downloadReport = async (id)=>{
      const report = await getReport(id);
      if(!report) return;
      const url = report.downloadUrl || report.url || report.pdfUrl;
      if(!url) return;
      window.open(url, "_blank", "noopener");
    };

    const crcTable = (()=> {
      const table = new Uint32Array(256);
      for(let i = 0; i < 256; i++){
        let c = i;
        for(let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[i] = c >>> 0;
      }
      return table;
    })();

    const crc32 = (bytes)=>{
      let crc = 0xffffffff;
      for(let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
      return (crc ^ 0xffffffff) >>> 0;
    };

    const concatBytes = (parts)=>{
      const total = parts.reduce((sum, part)=>sum + part.length, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      parts.forEach(part=>{
        out.set(part, offset);
        offset += part.length;
      });
      return out;
    };

    const u16 = (value)=>new Uint8Array([value & 255, (value >>> 8) & 255]);
    const u32 = (value)=>new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);

    const createZip = (files)=>{
      const encoder = new TextEncoder();
      const locals = [];
      const centrals = [];
      let offset = 0;
      const now = new Date();
      const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
      const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
      files.forEach(file=>{
        const nameBytes = encoder.encode(file.name);
        const dataBytes = new Uint8Array(file.data);
        const crc = crc32(dataBytes);
        const local = concatBytes([
          u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate),
          u32(crc), u32(dataBytes.length), u32(dataBytes.length), u16(nameBytes.length), u16(0),
          nameBytes, dataBytes
        ]);
        const central = concatBytes([
          u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate),
          u32(crc), u32(dataBytes.length), u32(dataBytes.length), u16(nameBytes.length), u16(0), u16(0),
          u16(0), u16(0), u32(0), u32(offset), nameBytes
        ]);
        locals.push(local);
        centrals.push(central);
        offset += local.length;
      });
      const centralSize = centrals.reduce((sum, part)=>sum + part.length, 0);
      const end = concatBytes([
        u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
        u32(centralSize), u32(offset), u16(0)
      ]);
      return new Blob([...locals, ...centrals, end], {type:"application/zip"});
    };

    const downloadSelectedReports = async ()=>{
      const ids = $$("[data-select-report]:checked", root).map(input=>input.value);
      if(!ids.length){
        if(selectedCount) selectedCount.textContent = "请先选择文件";
        return;
      }
      const reports = (await Promise.all(ids.map(getReport))).filter(Boolean);
      const files = await Promise.all(reports.map(async report=>{
        const url = report.downloadUrl || report.url || report.pdfUrl;
        if(!url) return null;
        const response = await fetch(url);
        if(!response.ok) return null;
        return {
          name: safeFileName(`${report.username || report.name}-${report.week}-${report.fileName}`),
          data: await response.arrayBuffer()
        };
      }));
      const zip = createZip(files.filter(Boolean));
      const url = URL.createObjectURL(zip);
      const link = document.createElement("a");
      link.href = url;
      link.download = `周报打包-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url), 1000);
    };

    const clearPreview = ()=>{
      if(preview) preview.innerHTML = '<div class="report-empty">在线查看会在新标签页打开 PDF。</div>';
    };

    const deleteReports = async (ids)=>{
      const realIds = ids.filter(Boolean);
      if(!realIds.length){
        if(selectedCount) selectedCount.textContent = "请先选择文件";
        return;
      }
      if(!window.confirm(`确定删除 ${realIds.length} 份周报吗？删除后本浏览器中不可恢复。`)) return;
      await Promise.all(realIds.map(deleteReport));
      clearPreview();
      await renderReports();
    };

    const previewReport = async (id)=>{
      const report = await getReport(id);
      if(!report || !preview) return;
      const lowerName = report.fileName.toLowerCase();
      const previewUrl = report.pdfUrl || (lowerName.endsWith(".pdf") ? (report.url || report.downloadUrl) : "");
      if(previewUrl){
        window.open(previewUrl, "_blank", "noopener");
        preview.innerHTML = `<div class="report-empty">已在新标签页打开：${escapeHtml(report.fileName)}</div>`;
      }else{
        preview.innerHTML = `
          <div class="report-preview-card">
            <strong>${escapeHtml(report.fileName)}</strong>
            <span>${escapeHtml(report.name)} · ${escapeHtml(report.week)} · ${formatSize(report.fileSize)}</span>
            <span>该文件没有可预览 PDF 地址，请先在服务器端完成 Word 转 PDF 并返回 pdfUrl。</span>
            <button class="btn-primary" data-download-current="${report.id}" type="button">下载文件</button>
          </div>`;
      }
    };

    const updateSelectedCount = ()=>{
      if(!selectedCount) return;
      const count = $$("[data-select-report]:checked", root).length;
      selectedCount.textContent = count ? `已选择 ${count} 个文件` : "未选择文件";
    };

    const getFilteredReports = ()=>{
      const nameValue = filterName ? filterName.value.trim().toLowerCase() : "";
      const weekValue = filterWeek ? filterWeek.value : "";
      return cachedReports.filter(report=>{
        const nameText = `${report.name || ""} ${report.username || ""}`.toLowerCase();
        const weekText = String(report.week || "");
        const matchesName = !nameValue || nameText.includes(nameValue);
        const matchesWeek = !weekValue || weekText.includes(weekValue);
        return matchesName && matchesWeek;
      });
    };

    const paintReportList = ()=>{
      if(!reportList) return;
      const reports = getFilteredReports();
      if(!reports.length){
        reportList.innerHTML = '<div class="report-empty">没有符合条件的周报。</div>';
        if(reportCount) reportCount.textContent = String(cachedReports.length);
        updateSelectedCount();
        return;
      }
      if(reportCount) reportCount.textContent = String(cachedReports.length);
      const rowsHtml = reports.map(report=>{
        const uploaded = new Date(report.uploadedAt).toLocaleString("zh-CN", {hour12:false});
        const lowerName = String(report.fileName || "").toLowerCase();
        const previewUrl = report.pdfUrl || (lowerName.endsWith(".pdf") ? (report.url || report.downloadUrl) : "");
        const downloadUrl = report.downloadUrl || report.url || report.pdfUrl || "";
        const displayName = report.name || report.displayName || report.username || "";
        const previewAction = previewUrl
          ? `<a class="btn-secondary" href="${escapeHtml(previewUrl)}" rel="noopener" target="_blank">在线查看</a>`
          : `<button class="btn-secondary" disabled="" type="button">暂无预览</button>`;
        const downloadAction = downloadUrl
          ? `<a class="btn-primary" href="${escapeHtml(downloadUrl)}" rel="noopener" target="_blank">下载</a>`
          : `<button class="btn-primary" disabled="" type="button">下载</button>`;
        return `
          <div class="report-item" data-report-id="${report.id}">
            <input class="report-select" data-select-report="" type="checkbox" value="${escapeHtml(report.id)}" aria-label="选择 ${escapeHtml(displayName)} 的周报"/>
            <div class="report-item-cell"><strong>${escapeHtml(displayName)}</strong>${escapeHtml(report.username || "")}</div>
            <div class="report-item-cell">${escapeHtml(report.week)}</div>
            <div class="report-item-cell report-file-name" title="${escapeHtml(report.fileName)}">${escapeHtml(report.fileName)} · ${formatSize(report.fileSize || 0)}</div>
            <div class="report-item-cell">${uploaded}</div>
            <div class="report-item-actions">
              ${previewAction}
              ${downloadAction}
              <button class="btn-danger" data-delete-report="${report.id}" type="button">删除</button>
            </div>
          </div>`;
      }).join("");
      reportList.innerHTML = `
        <div class="report-table-head">
          <span></span>
          <span>成员</span>
          <span>周次</span>
          <span>文件</span>
          <span>提交时间</span>
          <span>操作</span>
        </div>
        ${rowsHtml}`;
      updateSelectedCount();
    };

    const reportRowHtml = (report, selectable=false)=>{
      const uploaded = new Date(report.uploadedAt).toLocaleString("zh-CN", {hour12:false});
      const lowerName = String(report.fileName || "").toLowerCase();
      const previewUrl = report.pdfUrl || (lowerName.endsWith(".pdf") ? (report.url || report.downloadUrl) : "");
      const downloadUrl = report.downloadUrl || report.url || report.pdfUrl || "";
      const displayName = report.name || report.displayName || report.username || "";
      const previewAction = previewUrl
        ? `<a class="btn-secondary" href="${escapeHtml(previewUrl)}" rel="noopener" target="_blank">在线查看</a>`
        : `<button class="btn-secondary" disabled="" type="button">暂无预览</button>`;
      const downloadAction = downloadUrl
        ? `<a class="btn-primary" href="${escapeHtml(downloadUrl)}" rel="noopener" target="_blank">下载</a>`
        : `<button class="btn-primary" disabled="" type="button">下载</button>`;
      return `
        <div class="report-item" data-report-id="${escapeHtml(report.id)}">
          ${selectable ? `<input class="report-select" data-select-report="" type="checkbox" value="${escapeHtml(report.id)}" aria-label="选择 ${escapeHtml(displayName)} 的周报"/>` : "<span></span>"}
          <div class="report-item-cell"><strong>${escapeHtml(displayName)}</strong>${escapeHtml(report.username || "")}</div>
          <div class="report-item-cell">${escapeHtml(report.week)}</div>
          <div class="report-item-cell report-file-name" title="${escapeHtml(report.fileName)}">${escapeHtml(report.fileName)} · ${formatSize(report.fileSize || 0)}</div>
          <div class="report-item-cell">${uploaded}</div>
          <div class="report-item-actions">
            ${previewAction}
            ${downloadAction}
            ${selectable ? `<button class="btn-danger" data-delete-report="${escapeHtml(report.id)}" type="button">删除</button>` : ""}
          </div>
        </div>`;
    };

    const renderUserHistory = async ()=>{
      if(!userHistory || !currentUser || currentUser.role !== "user") return;
      if(!reportApiBase){
        userHistory.innerHTML = '<div class="report-empty">尚未配置服务器存储接口，暂不能跨设备查看历史提交。</div>';
        return;
      }
      try{
        const reports = getVisibleReports(await getReports())
          .filter(report=>String(report.username || "") === currentUser.username)
          .sort((a, b)=>String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
        if(!reports.length){
          userHistory.innerHTML = '<div class="report-empty">暂无历史提交记录。</div>';
          return;
        }
        userHistory.innerHTML = `
          <div class="report-table-head">
            <span></span>
            <span>成员</span>
            <span>周次</span>
            <span>文件</span>
            <span>提交时间</span>
            <span>操作</span>
          </div>
          ${reports.map(report=>reportRowHtml(report, false)).join("")}`;
      }catch(error){
        userHistory.innerHTML = `<div class="report-empty">提交记录加载失败：${escapeHtml(error.message || "请检查网络或接口配置")}</div>`;
      }
    };

    const updateProgress = async ()=>{
      const rows = await getCloudUsers();
      const userRows = rows.filter(row=>row.role !== "admin");
      const currentWeek = "第1周";
      const submitted = new Set(cachedReports
        .filter(report=>String(report.week || "").includes(currentWeek))
        .map(report=>report.username || report.name));
      const doneRows = userRows.filter(row=>submitted.has(row.username) || submitted.has(row.displayName) || submitted.has(row.name));
      const missingRows = userRows.filter(row=>!submitted.has(row.username) && !submitted.has(row.displayName) && !submitted.has(row.name));
      const doneCount = doneRows.length;
      const total = userRows.length;
      const percent = total ? Math.round(doneCount / total * 100) : 0;
      if(progressSummary) progressSummary.textContent = `${doneCount}/${total}`;
      if(progressBar) progressBar.style.width = `${percent}%`;
      if(progressList){
        const renderGroup = (title, rows, cls, label)=>`
          <div class="progress-group">
            <div class="progress-group-title"><span>${title}</span><span>${rows.length} 人</span></div>
            ${rows.map(row=>`<div class="progress-row"><strong>${escapeHtml(row.displayName || row.name || row.username)}</strong><span class="${cls}">${label}</span></div>`).join("") || '<div class="progress-row"><span>暂无</span><span></span></div>'}
          </div>`;
        progressList.innerHTML = total ? `${renderGroup("已提交", doneRows, "done", "已交")}${renderGroup("未提交", missingRows, "missing", "未交")}` : "<span>暂无成员。</span>";
      }
    };

    const resetUserForm = ()=>{
      if(!adminUserForm) return;
      adminUserForm.reset();
      const editing = $("[name='editingUsername']", adminUserForm);
      const username = $("[name='username']", adminUserForm);
      if(editing) editing.value = "";
      if(username) username.readOnly = false;
    };

    const fillUserForm = (username)=>{
      if(!adminUserForm) return;
      const profile = (cloudUsers.length ? cloudUsers : defaultUserRows()).find(row=>row.username === username);
      if(!profile) return;
      const values = {
        editingUsername: profile.username,
        username: profile.username,
        displayName: profile.displayName || profile.name || "",
        college: profile.college || "",
        major: profile.major || "",
        entryYear: profile.entryYear || "",
        phone: profile.phone || "",
        email: profile.email || ""
      };
      Object.entries(values).forEach(([key, value])=>{
        const input = $(`[name="${key}"]`, adminUserForm);
        if(input) input.value = value;
      });
      const usernameInput = $("[name='username']", adminUserForm);
      if(usernameInput) usernameInput.readOnly = true;
      adminUserForm.scrollIntoView({behavior:"smooth", block:"center"});
    };

    const renderUsers = async ()=>{
      if(!userList) return;
      const rows = (await getCloudUsers()).filter(row=>row.role !== "admin");
      if(!rows.length){
        userList.innerHTML = '<div class="report-empty">暂无成员资料。</div>';
        return;
      }
      const warning = userList.dataset.userError ? `<div class="form-message is-error">云端用户接口暂不可用，当前显示内置默认资料：${escapeHtml(userList.dataset.userError)}</div>` : "";
      userList.innerHTML = warning + rows.map(row=>`
        <div class="user-row" data-user-row="${escapeHtml(row.username)}">
          <div><strong>${escapeHtml(row.username)}</strong>${escapeHtml(row.displayName || row.name || "")}</div>
          <div>${escapeHtml(row.entryYear || "")}</div>
          <div>${escapeHtml(row.college || "")}</div>
          <div>${escapeHtml(row.major || "")}</div>
          <div>${escapeHtml(row.phone || "")}</div>
          <div>${escapeHtml(row.email || "")}</div>
          <div class="user-row-actions">
            <button class="btn-secondary" data-edit-user="${escapeHtml(row.username)}" type="button">编辑</button>
            <button class="btn-danger" data-delete-user="${escapeHtml(row.username)}" type="button">删除</button>
          </div>
        </div>`).join("");
    };

    const renderReports = async ()=>{
      if(!reportList) return;
      if(!reportApiBase){
        reportList.innerHTML = '<div class="report-empty">尚未配置服务器存储接口。GitHub Pages 静态页面不能直接保存跨设备上传文件。</div>';
        cachedReports = [];
        if(reportCount) reportCount.textContent = "0";
        updateSelectedCount();
        updateProgress();
        return;
      }
      try{
        cachedReports = getVisibleReports(await getReports());
      }catch(error){
        cachedReports = [];
        reportList.innerHTML = `<div class="report-empty">周报列表加载失败：${escapeHtml(error.message || "请检查网络或接口配置")}</div>`;
        if(reportCount) reportCount.textContent = "0";
        updateSelectedCount();
        updateProgress();
        return;
      }
      if(!cachedReports.length){
        reportList.innerHTML = '<div class="report-empty">暂无周报记录。</div>';
        if(reportCount) reportCount.textContent = "0";
        updateSelectedCount();
        updateProgress();
        return;
      }
      paintReportList();
      updateProgress();
    };

    root.addEventListener("click", (event)=>{
      const downloadButton = event.target.closest("[data-download-report], [data-download-current]");
      const downloadSelectedButton = event.target.closest("[data-download-selected]");
      const deleteButton = event.target.closest("[data-delete-report]");
      const deleteSelectedButton = event.target.closest("[data-delete-selected]");
      const editUserButton = event.target.closest("[data-edit-user]");
      const deleteUserButton = event.target.closest("[data-delete-user]");
      const resetUserButton = event.target.closest("[data-reset-user-form]");
      if(downloadButton) downloadReport(downloadButton.dataset.downloadReport || downloadButton.dataset.downloadCurrent);
      if(downloadSelectedButton) downloadSelectedReports();
      if(deleteButton) deleteReports([deleteButton.dataset.deleteReport]);
      if(deleteSelectedButton) deleteReports($$("[data-select-report]:checked", root).map(input=>input.value));
      if(editUserButton) fillUserForm(editUserButton.dataset.editUser);
      if(resetUserButton) resetUserForm();
      if(deleteUserButton){
        const username = deleteUserButton.dataset.deleteUser;
        if(window.confirm(`确定删除成员 ${username} 吗？`)){
          deleteCloudUser(username).then(async ()=>{
            await renderUsers();
            await updateProgress();
          }).catch(error=>{
            if(userList) userList.insertAdjacentHTML("afterbegin", `<div class="form-message is-error">删除失败：${escapeHtml(error.message || "请检查云端用户接口")}</div>`);
          });
        }
      }
    });

    root.addEventListener("change", (event)=>{
      if(event.target.closest("[data-select-report]")) updateSelectedCount();
      if(event.target.closest("[data-filter-week]")) paintReportList();
    });

    root.addEventListener("input", (event)=>{
      if(event.target.closest("[data-filter-name]")) paintReportList();
    });

    if(adminUserForm){
      adminUserForm.addEventListener("submit", async (event)=>{
        event.preventDefault();
        const msg = $("[data-user-message]", adminUserForm);
        const data = new FormData(adminUserForm);
        const username = String(data.get("username") || "").trim();
        const profile = {
          username,
          password:"0000",
          role:"user",
          displayName:String(data.get("displayName") || "").trim(),
          college:String(data.get("college") || "").trim(),
          major:String(data.get("major") || "").trim(),
          entryYear:String(data.get("entryYear") || "").trim(),
          phone:String(data.get("phone") || "").trim(),
          email:String(data.get("email") || "").trim()
        };
        if(!profile.username || !profile.displayName){
          setMessage(msg, "请至少填写学号和姓名。", "error");
          return;
        }
        try{
          await saveCloudUser(profile);
          await renderUsers();
          await updateProgress();
          resetUserForm();
          setMessage(msg, "成员资料已保存到云端。", "success");
        }catch(error){
          setMessage(msg, `保存失败：${error.message || "请检查云端用户接口"}`, "error");
        }
      });
    }
  };

  $$("[data-weekly-report]").forEach(initWeeklyReport);
  $$("[data-carousel]").forEach(initCarousel);
})();
