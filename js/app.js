// 禅意阅读器 - 主控逻辑

document.addEventListener("DOMContentLoaded", () => {
  // ===== 状态管理 =====
  let currentSutraId = "xin-jing";
  let activeTheme = "theme-sand";
  let fontSize = 18; // 默认字号 18px
  let bookmarks = [];
  let totalGongde = 0;
  let autoMuyuInterval = null;
  let isAutoMuyuOn = false;
  let showTranslation = false; // 默认不全局展开译文，点击段落才展开
  let showNotes = false;       // 默认不全局展开注释，点击段落才展开

  // ===== DOM 元素引用 =====
  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const searchInput = document.getElementById("searchInput");
  const sutraListContainer = document.getElementById("sutraListContainer");
  const readerArticle = document.getElementById("readerArticle");
  const readerContainer = document.getElementById("readerContainer");
  
  // 设置按钮
  const themeDots = document.querySelectorAll(".theme-dot");
  const btnFontDecrease = document.getElementById("btnFontDecrease");
  const btnFontIncrease = document.getElementById("btnFontIncrease");
  const btnFontSizeIndicator = document.getElementById("btnFontSizeIndicator");
  const btnToggleBookmarks = document.getElementById("btnToggleBookmarks");

  // 译注控制按钮
  const transNotesToggleGroup = document.getElementById("transNotesToggleGroup");
  const btnToggleTrans = document.getElementById("btnToggleTrans");
  const btnToggleNotes = document.getElementById("btnToggleNotes");
  
  // 书签抽屉
  const bookmarksDrawer = document.getElementById("bookmarksDrawer");
  const btnCloseBookmarks = document.getElementById("btnCloseBookmarks");
  const bookmarkList = document.getElementById("bookmarkList");
  
  // 电子木鱼
  const muyuBtn = document.getElementById("muyuBtn");
  const muyuPanel = document.getElementById("muyuPanel");
  const closePanelBtn = document.getElementById("closePanelBtn");
  const muyuSvgWrapper = document.getElementById("muyuSvgWrapper");
  const gongdeCountSpan = document.getElementById("gongdeCountSpan");
  const autoMuyuSwitch = document.getElementById("autoMuyuSwitch");
  const readingProgressBar = document.getElementById("readingProgressBar");

  // ===== 初始化配置 =====
  function init() {
    loadSettings();
    renderSutraList();
    loadSutra(currentSutraId);
    renderBookmarks();
    setupEventListeners();
  }

  // 从 LocalStorage 加载设置
  function loadSettings() {
    // 主题
    const savedTheme = localStorage.getItem("zen-theme");
    if (savedTheme) {
      activeTheme = savedTheme;
    }
    body.className = activeTheme;
    updateThemeSelectorActiveDot();

    // 字号
    const savedFontSize = localStorage.getItem("zen-font-size");
    if (savedFontSize) {
      fontSize = parseInt(savedFontSize, 10);
    }
    updateFontSizeDisplay();

    // 书签
    const savedBookmarks = localStorage.getItem("zen-bookmarks");
    if (savedBookmarks) {
      bookmarks = JSON.parse(savedBookmarks);
    }

    // 功德计数
    const savedGongde = localStorage.getItem("zen-gongde-count");
    if (savedGongde) {
      totalGongde = parseInt(savedGongde, 10);
      gongdeCountSpan.textContent = totalGongde;
    }

    // 译文 & 注释显示状态
    const savedShowTrans = localStorage.getItem("zen-show-translation");
    if (savedShowTrans !== null) {
      showTranslation = savedShowTrans === "true";
    }
    const savedShowNotes = localStorage.getItem("zen-show-notes");
    if (savedShowNotes !== null) {
      showNotes = savedShowNotes === "true";
    }
    updateToggleButtonsState();
  }

  // 更新译注开关按钮在 UI 上的高亮状态
  function updateToggleButtonsState() {
    if (btnToggleTrans && btnToggleNotes) {
      if (showTranslation) {
        btnToggleTrans.classList.add("active");
      } else {
        btnToggleTrans.classList.remove("active");
      }
      if (showNotes) {
        btnToggleNotes.classList.add("active");
      } else {
        btnToggleNotes.classList.remove("active");
      }
    }
  }

  // 根据当前显示设置，在 readerArticle 容器上切换相应的 class 类名（用于 CSS 隐显控制）
  function updateDisplayOptions() {
    if (readerArticle) {
      if (showTranslation) {
        readerArticle.classList.remove("hide-translation");
      } else {
        readerArticle.classList.add("hide-translation");
      }
      if (showNotes) {
        readerArticle.classList.remove("hide-notes");
      } else {
        readerArticle.classList.add("hide-notes");
      }
    }
  }

  // 保存设置
  function saveSettings(key, value) {
    localStorage.setItem(key, value);
  }

  // ===== 渲染经文列表 =====
  function renderSutraList(filterQuery = "") {
    sutraListContainer.innerHTML = "";
    
    // 按门类对经文进行分组
    const categories = {};
    window.SUTRA_DATA.forEach(sutra => {
      // 过滤搜索内容
      if (filterQuery && 
          !sutra.title.includes(filterQuery) && 
          !sutra.introduction.includes(filterQuery)) {
        return;
      }
      
      if (!categories[sutra.category]) {
        categories[sutra.category] = [];
      }
      categories[sutra.category].push(sutra);
    });

    // 渲染分组
    Object.keys(categories).forEach(catName => {
      const group = document.createElement("div");
      group.className = "category-group";
      
      const title = document.createElement("div");
      title.className = "category-title";
      title.textContent = catName;
      group.appendChild(title);
      
      const list = document.createElement("ul");
      list.className = "sutra-list";
      
      categories[catName].forEach(sutra => {
        const item = document.createElement("li");
        item.className = `sutra-item ${sutra.id === currentSutraId ? 'active' : ''}`;
        item.dataset.id = sutra.id;
        
        const itemTitle = document.createElement("span");
        itemTitle.className = "sutra-item-title";
        itemTitle.textContent = sutra.title;
        
        const itemMeta = document.createElement("span");
        itemMeta.className = "sutra-item-meta";
        itemMeta.textContent = `${sutra.translator} • ${sutra.tags[0]}`;
        
        item.appendChild(itemTitle);
        item.appendChild(itemMeta);
        
        item.addEventListener("click", () => {
          document.querySelectorAll(".sutra-item").forEach(el => el.classList.remove("active"));
          item.classList.add("active");
          loadSutra(sutra.id);
          // 在手机端选择经文后自动关闭侧边栏
          if (window.innerWidth <= 768) {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
          }
        });
        
        list.appendChild(item);
      });
      
      group.appendChild(list);
      sutraListContainer.appendChild(group);
    });
    
    if (sutraListContainer.children.length === 0) {
      sutraListContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 20px;">无匹配经文</div>`;
    }
  }

  // ===== 加载与渲染经文文章 =====
  function loadSutra(sutraId) {
    currentSutraId = sutraId;
    const catalogItem = window.SUTRA_DATA.find(s => s.id === sutraId);
    if (!catalogItem) return;

    // 平滑淡出，并显示加载状态
    readerArticle.classList.add("fade-out");
    
    setTimeout(() => {
      readerArticle.innerHTML = `
        <div style="text-align: center; padding: 120px 0; font-family: 'Noto Serif SC', serif; font-size: 18px; color: var(--text-secondary); letter-spacing: 2px;">
          <span class="brand-icon" style="display:inline-block; font-size: 36px; animation: lotus-pulse 2s infinite ease-in-out; margin-bottom: 20px;">🪷</span>
          <br>净心载入中...
        </div>
      `;
      readerArticle.classList.remove("fade-out");
      
      // 发送请求动态加载完整经文 JSON
      fetch(`data/${sutraId}.json`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`加载经文失败 (${response.status})`);
          }
          return response.json();
        })
        .then(sutra => {
          // 淡出加载动画
          readerArticle.classList.add("fade-out");
          
          setTimeout(() => {
            // 根据是否有译注数据决定显示/隐藏控制按钮组
            const hasTranslation = sutra.chapters.length > 0 && 
                                   sutra.chapters[0].paragraphs.length > 0 && 
                                   typeof sutra.chapters[0].paragraphs[0] === 'object';
            
            if (transNotesToggleGroup) {
              if (hasTranslation) {
                transNotesToggleGroup.style.display = "inline-flex";
              } else {
                transNotesToggleGroup.style.display = "none";
              }
            }

            // 头部 HTML
            let html = `
              <div class="sutra-header">
                <h2 class="sutra-title">${sutra.title}</h2>
                <div class="sutra-translator">${sutra.translator}</div>
                <div class="sutra-intro">${sutra.introduction}</div>
              </div>
            `;

            // 章节与段落
            sutra.chapters.forEach((chapter, chapIndex) => {
              html += `<div class="sutra-chapter">`;
              if (sutra.chapters.length > 1 || (chapter.title !== "正文" && chapter.title !== "陀罗尼正文" && chapter.title !== "普门品全文")) {
                html += `<h3 class="chapter-title">${chapter.title}</h3>`;
              }
              
              chapter.paragraphs.forEach((p, pIndex) => {
                const pId = `${sutraId}-${chapIndex}-${pIndex}`;
                const isBookmarked = bookmarks.some(b => b.id === pId);
                
                if (typeof p === 'object') {
                  // 译注对照排版
                  let pHTML = ``;
                  
                  // 1. 原文部分 (加入序号和原文内容)
                  pHTML += `<span class="sutra-paragraph-num">${p.num}</span>`;
                  pHTML += `<span class="sutra-original-text">${p.original}</span>`;
                  
                  // 2. 译文部分 (如果存在就生成，显示/隐藏由 CSS 控制)
                  if (p.translation) {
                    const formattedTrans = p.translation.replace(/\n/g, '<br>');
                    pHTML += `<div class="sutra-translation" onclick="event.stopPropagation()">${formattedTrans}</div>`;
                  }
                  
                  // 3. 注释部分 (如果存在就生成，显示/隐藏由 CSS 控制)
                  if (p.notes && p.notes.length > 0) {
                    pHTML += `<div class="sutra-notes" onclick="event.stopPropagation()">`;
                    p.notes.forEach(note => {
                      pHTML += `<div class="sutra-note-item">${note}</div>`;
                    });
                    pHTML += `</div>`;
                  }
                  
                  html += `
                    <div class="sutra-paragraph has-trans ${isBookmarked ? 'bookmarked' : ''}" 
                         id="${pId}" 
                         data-sutra-title="${sutra.title}"
                         data-chapter-title="${chapter.title}"
                         data-p-index="${pIndex}"
                         data-chap-index="${chapIndex}"
                         title="点击展开/收起译注对照">
                      <span class="bookmark-btn" title="添加/取消书签">🔖</span>
                      ${pHTML}
                    </div>
                  `;
                } else {
                  // 传统经文排版 (纯字符串)
                  const isVerse = p.includes('\n');
                  const formattedText = p.replace(/\n/g, '<br>');
                  html += `
                    <p class="sutra-paragraph ${isBookmarked ? 'bookmarked' : ''} ${isVerse ? 'verse-paragraph' : ''}" 
                       id="${pId}" 
                       data-sutra-title="${sutra.title}"
                       data-chapter-title="${chapter.title}"
                       data-p-index="${pIndex}"
                       data-chap-index="${chapIndex}">
                      <span class="bookmark-btn" title="添加/取消书签">🔖</span>
                      ${formattedText}
                    </p>
                  `;
                }
              });
              html += `</div>`;
            });

            readerArticle.innerHTML = html;
            
            // 应用译文 & 注释的显示设置类名到容器上
            updateDisplayOptions();
            
            readerArticle.classList.remove("fade-out");
            
            // 重置滚动条到顶部
            readerContainer.scrollTop = 0;
            updateProgressBar();

            // 绑定段落书签点击事件
            setupParagraphListeners();
          }, 250);
        })
        .catch(err => {
          console.error(err);
          readerArticle.innerHTML = `
            <div style="text-align: center; padding: 100px 24px; font-family: 'Noto Serif SC', serif; color: var(--text-secondary);">
              <span style="font-size: 32px; display: block; margin-bottom: 20px;">⚠️</span>
              <h3 style="font-size: 20px; margin-bottom: 12px; color: var(--accent-color);">经文载入失败</h3>
              <p style="font-size: 14px; line-height: 1.6; max-width: 500px; margin: 0 auto; opacity: 0.8;">
                浏览器拦截了本地文件获取请求。请使用【方法二】启动本地微型服务器预览：
                <br><br>
                <code style="background: rgba(0,0,0,0.06); padding: 4px 8px; border-radius: 4px; font-family: monospace;">python -m http.server 8000</code>
                <br><br>
                然后访问：<a href="http://localhost:8000" style="color: var(--accent-color); text-decoration: underline; font-weight: 600;">http://localhost:8000</a> 即可正常使用。
              </p>
            </div>
          `;
        });
    }, 250);
  }

  // 段落交互事件（展开/折叠及书签控制）
  function setupParagraphListeners() {
    const paragraphs = readerArticle.querySelectorAll(".sutra-paragraph");
    paragraphs.forEach(p => {
      // 1. 段落点击事件：用于展开/折叠译注对照
      p.addEventListener("click", (e) => {
        // 如果点击的是书签按钮，不触发展开折叠
        if (e.target.classList.contains("bookmark-btn")) return;
        
        // 只有具有译注的段落才支持展开折叠
        if (p.classList.contains("has-trans")) {
          p.classList.toggle("expanded");
        }
      });

      // 2. 书签按钮点击事件
      const bookmarkBtn = p.querySelector(".bookmark-btn");
      if (bookmarkBtn) {
        bookmarkBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // 阻止事件冒泡到段落点击

          const pId = p.id;
          const sutraTitle = p.dataset.sutraTitle;
          const chapterTitle = p.dataset.chapterTitle;
          const pIndex = parseInt(p.dataset.pIndex, 10);
          const chapIndex = parseInt(p.dataset.chapIndex, 10);
          
          // 获取纯原文文本（排除书签图标、序号、译文和注释）
          let text = "";
          const origTextNode = p.querySelector(".sutra-original-text");
          if (origTextNode) {
            text = origTextNode.textContent.trim();
          } else {
            // 传统经文（排除 .bookmark-btn 节点后的文本）
            text = Array.from(p.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains("bookmark-btn")))
              .map(node => node.textContent)
              .join("")
              .trim();
          }

          const bookmarkIndex = bookmarks.findIndex(b => b.id === pId);
          if (bookmarkIndex > -1) {
            // 取消书签
            bookmarks.splice(bookmarkIndex, 1);
            p.classList.remove("bookmarked");
            showFloatingText("已取消书签", p);
          } else {
            // 添加书签
            bookmarks.push({
              id: pId,
              sutraId: currentSutraId,
              sutraTitle: sutraTitle,
              chapterTitle: chapterTitle,
              chapIndex: chapIndex,
              pIndex: pIndex,
              excerpt: text
            });
            p.classList.add("bookmarked");
            showFloatingText("🔖 已添加书签", p);
          }

          saveSettings("zen-bookmarks", JSON.stringify(bookmarks));
          renderBookmarks();
        });
      }
    });
  }

  // 显示临时的气泡通知（如添加书签提示）
  function showFloatingText(text, targetElement) {
    const bubble = document.createElement("span");
    bubble.className = "gongde-float";
    bubble.textContent = text;
    bubble.style.fontSize = "14px";
    
    // 计算位置
    const rect = targetElement.getBoundingClientRect();
    bubble.style.left = `50%`;
    bubble.style.top = `${rect.top + window.scrollY - 30}px`;
    bubble.style.position = "absolute";
    bubble.style.transform = "translateX(-50%)";
    
    document.body.appendChild(bubble);
    
    setTimeout(() => {
      bubble.remove();
    }, 1000);
  }

  // ===== 渲染书签抽屉 =====
  function renderBookmarks() {
    bookmarkList.innerHTML = "";
    if (bookmarks.length === 0) {
      bookmarkList.innerHTML = `<div class="no-bookmarks">暂无保存的书签，阅读时点击段落即可添加</div>`;
      return;
    }

    bookmarks.forEach(b => {
      const card = document.createElement("li");
      card.className = "bookmark-card";
      
      const title = document.createElement("div");
      title.className = "bookmark-card-title";
      title.textContent = `${b.sutraTitle} • ${b.chapterTitle}`;
      
      const excerpt = document.createElement("div");
      excerpt.className = "bookmark-card-excerpt";
      excerpt.textContent = b.excerpt;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "bookmark-card-delete";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "删除书签";
      
      card.appendChild(title);
      card.appendChild(excerpt);
      card.appendChild(deleteBtn);

      // 点击跳转到指定段落
      card.addEventListener("click", (e) => {
        if (e.target === deleteBtn) return; // 如果点的是删除，不执行跳转

        if (currentSutraId !== b.sutraId) {
          // 先加载经文
          currentSutraId = b.sutraId;
          document.querySelectorAll(".sutra-item").forEach(el => el.classList.remove("active"));
          const activeSutraItem = document.querySelector(`.sutra-item[data-id="${b.sutraId}"]`);
          if (activeSutraItem) activeSutraItem.classList.add("active");
          
          loadSutra(b.sutraId);
          // 等待加载渲染完成后滚动
          setTimeout(() => scrollToParagraph(b.id), 300);
        } else {
          scrollToParagraph(b.id);
        }

        // 自动关闭书签抽屉
        bookmarksDrawer.classList.remove("active");
      });

      // 删除按钮事件
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const bIndex = bookmarks.findIndex(bk => bk.id === b.id);
        if (bIndex > -1) {
          bookmarks.splice(bIndex, 1);
          saveSettings("zen-bookmarks", JSON.stringify(bookmarks));
          renderBookmarks();
          
          // 如果当前正处于对应的经文页面，也把段落样式去掉
          const paraEl = document.getElementById(b.id);
          if (paraEl) {
            paraEl.classList.remove("bookmarked");
          }
        }
      });

      bookmarkList.appendChild(card);
    });
  }

  function scrollToParagraph(pId) {
    const el = document.getElementById(pId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // 给个闪烁高亮效果
      el.style.backgroundColor = "var(--accent-light)";
      setTimeout(() => {
        el.style.backgroundColor = "";
      }, 1500);
    }
  }

  // ===== 滚动进度条 =====
  function updateProgressBar() {
    const containerHeight = readerContainer.scrollHeight - readerContainer.clientHeight;
    if (containerHeight <= 0) {
      readingProgressBar.style.width = "0%";
      return;
    }
    const scrolled = (readerContainer.scrollTop / containerHeight) * 100;
    readingProgressBar.style.width = `${Math.min(scrolled, 100)}%`;
  }

  // ===== Web Audio 电子木鱼发生器 =====
  function playWoodenFishSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      const ctx = new AudioContext();
      
      // 主共鸣体：三角形波模拟木盒打击
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(190, ctx.currentTime); // 190Hz，沉闷的木头音
      // 音频频率在打击瞬间迅速下滑，模拟弹性木锤
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);

      // 低通滤波器阻隔过尖的声音，模拟木盒空心回声
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(750, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      // 音量衰减
      gainNode.gain.setValueAtTime(0.7, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      // 瞬态打击声 (锤击木头表面清脆的那一下)
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = "sine";
      clickOsc.frequency.setValueAtTime(1100, ctx.currentTime);
      
      clickGain.gain.setValueAtTime(0.12, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

      // 连结
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);

      // 起始与终结
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);

      clickOsc.start(ctx.currentTime);
      clickOsc.stop(ctx.currentTime + 0.025);
    } catch (e) {
      console.warn("AudioContext 播放失败：", e);
    }
  }

  // 敲击木鱼核心方法
  function tapWoodenFish(event) {
    // 增加功德
    totalGongde++;
    gongdeCountSpan.textContent = totalGongde;
    saveSettings("zen-gongde-count", totalGongde);

    // 播放音效
    playWoodenFishSound();

    // 触发动画
    muyuSvgWrapper.classList.remove("tap");
    void muyuSvgWrapper.offsetWidth; // 触发 reflow 重置动画
    muyuSvgWrapper.classList.add("tap");

    // 功德浮动字效
    createGongdeFloat(event);
  }

  function createGongdeFloat(event) {
    const textOptions = ["功德 +1", "智慧 +1", "烦恼 -1", "静心 +1", "福报 +1", "顺遂 +1"];
    const randomText = textOptions[Math.floor(Math.random() * textOptions.length)];
    
    const floatSpan = document.createElement("span");
    floatSpan.className = "gongde-float";
    floatSpan.textContent = randomText;

    // 确定漂浮起始位置
    let x, y;
    if (event && event.clientX && event.clientY) {
      // 玩家手点的位置
      const rect = muyuSvgWrapper.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else {
      // 自动播放时，浮在正中心偏上
      x = 60;
      y = 10;
    }

    floatSpan.style.left = `${x}px`;
    floatSpan.style.top = `${y}px`;
    muyuSvgWrapper.appendChild(floatSpan);

    // 播放完移除
    setTimeout(() => {
      floatSpan.remove();
    }, 1000);
  }

  // ===== 设置与交互事件绑定 =====
  function setupEventListeners() {
    // 侧边栏展开收起
    toggleSidebarBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });

    // 经文搜索
    searchInput.addEventListener("input", (e) => {
      renderSutraList(e.target.value.trim());
    });

    // 书签抽屉开关
    btnToggleBookmarks.addEventListener("click", () => {
      bookmarksDrawer.classList.toggle("active");
    });

    btnCloseBookmarks.addEventListener("click", () => {
      bookmarksDrawer.classList.remove("active");
    });

    // 字号调节
    btnFontDecrease.addEventListener("click", () => {
      if (fontSize > 14) {
        fontSize -= 2;
        updateFontSize();
      }
    });

    btnFontIncrease.addEventListener("click", () => {
      if (fontSize < 32) {
        fontSize += 2;
        updateFontSize();
      }
    });

    // 译注开关点击事件
    if (btnToggleTrans) {
      btnToggleTrans.addEventListener("click", () => {
        showTranslation = !showTranslation;
        saveSettings("zen-show-translation", showTranslation);
        updateToggleButtonsState();
        updateDisplayOptions();
      });
    }

    if (btnToggleNotes) {
      btnToggleNotes.addEventListener("click", () => {
        showNotes = !showNotes;
        saveSettings("zen-show-notes", showNotes);
        updateToggleButtonsState();
        updateDisplayOptions();
      });
    }

    // 主题切换
    themeDots.forEach(dot => {
      dot.addEventListener("click", () => {
        themeDots.forEach(d => d.classList.remove("active"));
        dot.classList.add("active");
        
        const newTheme = dot.dataset.theme;
        body.classList.remove(activeTheme);
        body.classList.add(newTheme);
        activeTheme = newTheme;
        
        saveSettings("zen-theme", activeTheme);
      });
    });

    // 电子木鱼悬浮按钮打开面板
    muyuBtn.addEventListener("click", () => {
      muyuPanel.classList.toggle("active");
    });

    closePanelBtn.addEventListener("click", () => {
      muyuPanel.classList.remove("active");
    });

    // 敲击木鱼
    muyuSvgWrapper.addEventListener("mousedown", (e) => {
      tapWoodenFish(e);
    });

    // 自动敲木鱼开关
    autoMuyuSwitch.addEventListener("click", () => {
      isAutoMuyuOn = !isAutoMuyuOn;
      if (isAutoMuyuOn) {
        autoMuyuSwitch.classList.add("on");
        // 开始定时自动敲击
        autoMuyuInterval = setInterval(() => {
          tapWoodenFish(null);
        }, 1500);
      } else {
        autoMuyuSwitch.classList.remove("on");
        if (autoMuyuInterval) {
          clearInterval(autoMuyuInterval);
          autoMuyuInterval = null;
        }
      }
    });

    // 阅读区滚动时更新进度条
    readerContainer.addEventListener("scroll", updateProgressBar);
  }

  function updateFontSize() {
    updateFontSizeDisplay();
    saveSettings("zen-font-size", fontSize);
  }

  function updateFontSizeDisplay() {
    btnFontSizeIndicator.textContent = `${fontSize}px`;
    // 设置段落的 font-size
    document.documentElement.style.setProperty("--reader-font-size", `${fontSize}px`);
    // 动态调整行高，让大字号排版更舒服
    const lineVal = fontSize >= 24 ? 1.85 : 1.75;
    document.documentElement.style.setProperty("--reader-line-height", lineVal);
  }

  function updateThemeSelectorActiveDot() {
    themeDots.forEach(dot => {
      if (dot.dataset.theme === activeTheme) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  // 运行程序
  init();
});
