document.addEventListener("click", (e) => {
  const block = e.target.closest("pre code, code");
  if (!block) return;
  navigator.clipboard.writeText(block.innerText).then(() => {
    const tip = document.createElement("span");
    tip.textContent = "已复制";
    tip.style.cssText = "position:fixed;bottom:20px;right:20px;background:#4caf50;color:#fff;padding:6px 14px;border-radius:6px;font-size:13px;z-index:9999";
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 1500);
  });
});
